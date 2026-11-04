package com.skull.logbook.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class FirebaseServiceTest {

    private static final String PROJECT_ID = "demo-logbook";
    private static final String CLIENT_EMAIL = "firebase-adminsdk@demo-logbook.iam.gserviceaccount.com";

    private static KeyPair keyPair;
    private static String serviceAccountBase64;

    @BeforeAll
    static void createServiceAccount() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keyPair = generator.generateKeyPair();

        String pem = "-----BEGIN PRIVATE KEY-----\\n"
                + Base64.getEncoder().encodeToString(keyPair.getPrivate().getEncoded())
                + "\\n-----END PRIVATE KEY-----\\n";
        String json = """
                {"type":"service_account","project_id":"%s","private_key_id":"test",
                 "private_key":"%s","client_email":"%s","client_id":"1",
                 "token_uri":"https://oauth2.googleapis.com/token"}
                """.formatted(PROJECT_ID, pem, CLIENT_EMAIL);
        serviceAccountBase64 = Base64.getEncoder().encodeToString(json.getBytes());
    }

    // 프론트 chatService.js의 sanitizeRoomName을 node로 실행한 결과와 비교
    @Test
    void collectionNameMatchesFrontendRule() {
        assertThat(FirebaseService.collectionName("일반 채팅방")).isEqualTo("chatroom_일반_채팅방_messages");
        assertThat(FirebaseService.collectionName("VIP 라운지")).isEqualTo("chatroom_vip_라운지_messages");
        assertThat(FirebaseService.collectionName("VIP 라운지!")).isEqualTo("chatroom_vip_라운지_messages");
        assertThat(FirebaseService.collectionName("  Test\t  Room  ")).isEqualTo("chatroom__test_room__messages");
        assertThat(FirebaseService.collectionName("a　b")).isEqualTo("chatroom_a_b_messages");
        assertThat(FirebaseService.collectionName("!!!")).isEqualTo("chatroom__messages");
    }

    @Test
    void customTokenFollowsFirebaseFormat() {
        FirebaseService service = new FirebaseService(serviceAccountBase64, "http://unused");

        String token = service.createCustomToken(7L, "susy", "코스모스");

        Claims claims = Jwts.parserBuilder().setSigningKey(keyPair.getPublic()).build()
                .parseClaimsJws(token).getBody();
        assertThat(claims.getIssuer()).isEqualTo(CLIENT_EMAIL);
        assertThat(claims.getSubject()).isEqualTo(CLIENT_EMAIL);
        assertThat(claims.getAudience())
                .isEqualTo("https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit");
        assertThat(claims.get("uid")).isEqualTo("7");
        assertThat(claims.get("claims", Map.class)).containsEntry("loginId", "susy").containsEntry("nickName", "코스모스");
        assertThat(claims.getExpiration().getTime() - claims.getIssuedAt().getTime()).isEqualTo(3600_000L);
    }

    @Test
    void disabledWithoutServiceAccount() {
        FirebaseService service = new FirebaseService("", "http://unused");

        assertThat(service.isEnabled()).isFalse();
        assertThatThrownBy(() -> service.createCustomToken(1L, "a", "b")).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void invalidServiceAccountFailsFast() {
        assertThatThrownBy(() -> new FirebaseService("not-base64!", "http://unused"))
                .isInstanceOf(IllegalStateException.class);
    }

    // firebase emulators:exec 안에서만 실행
    @Test
    @EnabledIfEnvironmentVariable(named = "FIRESTORE_EMULATOR_HOST", matches = ".+")
    void managesRoomDataOnEmulator() {
        String baseUrl = "http://" + System.getenv("FIRESTORE_EMULATOR_HOST");
        FirebaseService service = new FirebaseService(serviceAccountBase64, baseUrl) {
            @Override
            protected String accessToken() {
                return "owner"; // 에뮬레이터 관리자 토큰
            }
        };
        RestClient client = RestClient.builder().baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer owner").build();
        String root = "projects/" + PROJECT_ID + "/databases/(default)/documents";
        String roomName = "삭제 테스트 방";
        String collection = FirebaseService.collectionName(roomName);

        service.saveRoomAccess(List.of(new FirebaseService.RoomAccess(collection, roomName, true, false)));
        service.addRoomMember(collection, 7L);

        Map<?, ?> access = client.get().uri("/v1/" + root + "/chatRoomAccess/{col}", collection)
                .retrieve().body(Map.class);
        assertThat(access.get("fields").toString()).contains("isPrivate={booleanValue=true}");
        assertThat(client.get().uri("/v1/" + root + "/chatRoomAccess/{col}/members/7", collection)
                .retrieve().toBodilessEntity().getStatusCode().is2xxSuccessful()).isTrue();

        // 한 번에 조회되는 개수보다 많은 메시지도 모두 지워지는지 확인
        List<Map<String, Object>> writes = new ArrayList<>();
        for (int i = 0; i < 350; i++) {
            writes.add(Map.of("update", Map.of("name", root + "/" + collection + "/m" + i,
                    "fields", Map.of("text", Map.of("stringValue", "x")))));
        }
        Map<String, Object> presence = Map.of("roomName", Map.of("stringValue", roomName));
        Map<String, Object> otherPresence = Map.of("roomName", Map.of("stringValue", "일반 채팅방"));
        writes.add(Map.of("update", Map.of("name", root + "/presence/" + roomName + "_7", "fields", presence)));
        writes.add(Map.of("update", Map.of("name", root + "/presence/keep_1", "fields", otherPresence)));
        client.post().uri("/v1/" + root + ":commit").contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("writes", writes)).retrieve().toBodilessEntity();

        service.deleteRoomData(roomName, collection);

        assertThat(client.get().uri("/v1/" + root + "/{col}", collection).retrieve().body(Map.class))
                .doesNotContainKey("documents");
        assertThat(client.get().uri("/v1/" + root + "/chatRoomAccess/{col}/members", collection).retrieve().body(Map.class))
                .doesNotContainKey("documents");
        assertThatThrownBy(() -> client.get().uri("/v1/" + root + "/chatRoomAccess/{col}", collection)
                .retrieve().toBodilessEntity()).isInstanceOf(HttpClientErrorException.NotFound.class);
        assertThatThrownBy(() -> client.get().uri("/v1/" + root + "/presence/{id}", roomName + "_7")
                .retrieve().toBodilessEntity()).isInstanceOf(HttpClientErrorException.NotFound.class);
        assertThat(client.get().uri("/v1/" + root + "/presence/keep_1")
                .retrieve().toBodilessEntity().getStatusCode().is2xxSuccessful()).isTrue();
    }
}
