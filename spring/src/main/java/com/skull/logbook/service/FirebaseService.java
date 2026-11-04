package com.skull.logbook.service;

import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.ServiceAccountCredentials;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Firebase 서비스 계정으로 처리하는 작업 모음.
 * - 프론트 Firebase 로그인용 Custom Token 발급
 * - Firestore 보안 규칙이 참조하는 채팅방 접근 정보(chatRoomAccess) 관리
 * - 채팅방 삭제 시 메시지/접속자 데이터 정리
 *
 * Alpine 이미지에서 gRPC 네이티브 라이브러리 문제를 피하기 위해 Firestore는 REST API로 호출한다.
 * 서비스 계정 키가 없으면 기능을 끄고 서버는 그대로 기동한다.
 */
@Slf4j
@Service
public class FirebaseService {

    private static final String CUSTOM_TOKEN_AUDIENCE =
            "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";
    private static final long CUSTOM_TOKEN_VALIDITY_MILLIS = 60 * 60 * 1000L; // Firebase 허용 최대값 1시간
    private static final int PAGE_SIZE = 300;

    private static final String ACCESS_COLLECTION = "chatRoomAccess";
    private static final String MEMBERS_COLLECTION = "members";
    private static final String PRESENCE_COLLECTION = "presence";

    // 프론트 chatService.js의 sanitizeRoomName과 같은 규칙이어야 함
    private static final Pattern ROOM_NAME_UNSAFE = Pattern.compile("[^a-zA-Z0-9가-힣\\s]", Pattern.UNICODE_CHARACTER_CLASS);
    private static final Pattern ROOM_NAME_SPACES = Pattern.compile("\\s+", Pattern.UNICODE_CHARACTER_CLASS);

    private final ServiceAccountCredentials credentials;
    private final RestClient restClient;

    public FirebaseService(
            @Value("${firebase.service-account-base64:}") String serviceAccountBase64,
            @Value("${firebase.firestore-base-url:https://firestore.googleapis.com}") String firestoreBaseUrl) {
        this.credentials = loadCredentials(serviceAccountBase64);
        this.restClient = RestClient.builder().baseUrl(firestoreBaseUrl).build();
        if (credentials == null) {
            log.warn("FIREBASE_SERVICE_ACCOUNT_BASE64가 없어 Firebase 토큰 발급과 채팅방 접근 관리가 꺼져 있습니다.");
        }
    }

    private static ServiceAccountCredentials loadCredentials(String serviceAccountBase64) {
        if (serviceAccountBase64 == null || serviceAccountBase64.isBlank()) {
            return null;
        }
        try {
            byte[] json = Base64.getDecoder().decode(serviceAccountBase64.trim());
            return ServiceAccountCredentials.fromStream(new ByteArrayInputStream(json))
                    .toBuilder()
                    .setScopes(List.of("https://www.googleapis.com/auth/datastore"))
                    .build();
        } catch (IOException | IllegalArgumentException e) {
            throw new IllegalStateException("FIREBASE_SERVICE_ACCOUNT_BASE64를 읽을 수 없습니다. 서비스 계정 JSON을 Base64로 넣어주세요.", e);
        }
    }

    public boolean isEnabled() {
        return credentials != null;
    }

    /** 채팅방 이름에 대응하는 Firestore 메시지 컬렉션 이름 */
    public static String collectionName(String roomName) {
        String sanitized = ROOM_NAME_UNSAFE.matcher(roomName).replaceAll("");
        sanitized = ROOM_NAME_SPACES.matcher(sanitized).replaceAll("_").toLowerCase(Locale.ROOT);
        return "chatroom_" + sanitized + "_messages";
    }

    /** uid는 DB 사용자 id. loginId, nickName은 규칙에서 사칭 검사에 쓰는 클레임 */
    public String createCustomToken(Long userId, String loginId, String nickName) {
        requireEnabled();
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setIssuer(credentials.getClientEmail())
                .setSubject(credentials.getClientEmail())
                .setAudience(CUSTOM_TOKEN_AUDIENCE)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + CUSTOM_TOKEN_VALIDITY_MILLIS))
                .claim("uid", String.valueOf(userId))
                .claim("claims", Map.of("loginId", loginId, "nickName", nickName))
                .signWith(credentials.getPrivateKey(), SignatureAlgorithm.RS256)
                .compact();
    }

    /** 채팅방 접근 정보를 저장. 규칙은 이 문서가 있는 방의 메시지만 허용한다. */
    public void saveRoomAccess(List<RoomAccess> rooms) {
        requireEnabled();
        List<Map<String, Object>> writes = new ArrayList<>();
        for (RoomAccess room : rooms) {
            writes.add(updateWrite(accessPath(room.collectionName()), Map.of(
                    "name", Map.of("stringValue", room.name()),
                    "isPrivate", Map.of("booleanValue", room.isPrivate()),
                    "guestReadable", Map.of("booleanValue", room.guestReadable()))));
        }
        commitInBatches(writes);
    }

    /** 비공개 방 입장을 허용. 규칙은 이 문서가 있는 사용자만 메시지를 읽고 쓰게 한다. */
    public void addRoomMember(String collectionName, Long userId) {
        requireEnabled();
        commitInBatches(List.of(updateWrite(memberPath(collectionName, userId), Map.of(
                "userId", Map.of("integerValue", String.valueOf(userId))))));
    }

    /** 채팅방의 메시지, 접속자, 접근 정보를 모두 삭제 */
    public void deleteRoomData(String roomName, String collectionName) {
        requireEnabled();
        // 접근 정보를 먼저 지워 삭제 도중 새 메시지가 들어오지 못하게 함
        List<String> paths = new ArrayList<>(listDocumentPaths(accessPath(collectionName) + "/" + MEMBERS_COLLECTION));
        paths.add(accessPath(collectionName));
        deleteDocuments(paths);
        deleteDocuments(listDocumentPaths(documentsRoot() + "/" + collectionName));
        deleteDocuments(findPresencePaths(roomName));
    }

    private void deleteDocuments(List<String> paths) {
        List<Map<String, Object>> writes = new ArrayList<>();
        for (String path : paths) {
            writes.add(Map.of("delete", path));
        }
        commitInBatches(writes);
    }

    private List<String> listDocumentPaths(String collectionPath) {
        List<String> paths = new ArrayList<>();
        String pageToken = null;
        do {
            String token = pageToken;
            Map<?, ?> response = restClient.get()
                    .uri(uri -> {
                        uri.path("/v1/" + collectionPath)
                                .queryParam("pageSize", PAGE_SIZE)
                                .queryParam("mask.fieldPaths", "__name__");
                        if (token != null) {
                            uri.queryParam("pageToken", token);
                        }
                        return uri.build();
                    })
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken())
                    .retrieve()
                    .body(Map.class);
            if (response == null) {
                break;
            }
            Object documents = response.get("documents");
            if (documents instanceof List<?> list) {
                for (Object document : list) {
                    paths.add(String.valueOf(((Map<?, ?>) document).get("name")));
                }
            }
            pageToken = (String) response.get("nextPageToken");
        } while (pageToken != null);
        return paths;
    }

    private List<String> findPresencePaths(String roomName) {
        Map<String, Object> query = Map.of("structuredQuery", Map.of(
                "from", List.of(Map.of("collectionId", PRESENCE_COLLECTION)),
                "where", Map.of("fieldFilter", Map.of(
                        "field", Map.of("fieldPath", "roomName"),
                        "op", "EQUAL",
                        "value", Map.of("stringValue", roomName))),
                "select", Map.of("fields", List.of(Map.of("fieldPath", "__name__")))));

        List<?> results = restClient.post()
                .uri("/v1/" + documentsRoot() + ":runQuery")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .body(query)
                .retrieve()
                .body(List.class);

        List<String> paths = new ArrayList<>();
        if (results != null) {
            for (Object result : results) {
                Object document = ((Map<?, ?>) result).get("document");
                if (document != null) {
                    paths.add(String.valueOf(((Map<?, ?>) document).get("name")));
                }
            }
        }
        return paths;
    }

    private void commitInBatches(List<Map<String, Object>> writes) {
        for (int start = 0; start < writes.size(); start += PAGE_SIZE) {
            List<Map<String, Object>> batch = writes.subList(start, Math.min(start + PAGE_SIZE, writes.size()));
            restClient.post()
                    .uri("/v1/" + documentsRoot() + ":commit")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("writes", batch))
                    .retrieve()
                    .toBodilessEntity();
        }
    }

    private Map<String, Object> updateWrite(String path, Map<String, Object> fields) {
        Map<String, Object> document = new LinkedHashMap<>();
        document.put("name", path);
        document.put("fields", fields);
        return Map.of("update", document);
    }

    private String accessPath(String collectionName) {
        return documentsRoot() + "/" + ACCESS_COLLECTION + "/" + collectionName;
    }

    private String memberPath(String collectionName, Long userId) {
        return accessPath(collectionName) + "/" + MEMBERS_COLLECTION + "/" + userId;
    }

    private String documentsRoot() {
        return "projects/" + credentials.getProjectId() + "/databases/(default)/documents";
    }

    // 테스트에서 에뮬레이터용 토큰으로 대체할 수 있도록 protected
    protected String accessToken() {
        try {
            credentials.refreshIfExpired();
            AccessToken token = credentials.getAccessToken();
            return token.getTokenValue();
        } catch (IOException e) {
            throw new IllegalStateException("Firebase 접근 토큰 발급에 실패했습니다.", e);
        }
    }

    private void requireEnabled() {
        if (!isEnabled()) {
            throw new IllegalStateException("Firebase 서비스 계정이 설정되지 않았습니다.");
        }
    }

    public record RoomAccess(String collectionName, String name, boolean isPrivate, boolean guestReadable) {
    }
}
