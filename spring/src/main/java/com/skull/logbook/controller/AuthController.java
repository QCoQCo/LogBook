package com.skull.logbook.controller;

import com.skull.logbook.dto.SignupRequestDto;
import com.skull.logbook.dto.UserResponseDto;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.UserRepository;
import com.skull.logbook.service.BlogService;
import com.skull.logbook.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final BlogService blogService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequestDto requestDto) {
        Long userId = userService.signup(requestDto);
        return ResponseEntity.ok(Map.of("message", "회원가입 성공", "userId", userId));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String loginId = loginRequest.get("loginId");
        String password = loginRequest.get("password");

        // UserService.login()이 이제 Map<String, String>을 반환함
        Map<String, String> tokens = userService.login(loginId, password);
        String accessToken = tokens.get("accessToken");
        String refreshToken = tokens.get("refreshToken");

        // HttpOnly 쿠키 설정
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie
                .from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // 개발 환경에서는 false, 운영(HTTPS)에서는 true 권장
                .path("/")
                .maxAge(7 * 24 * 60 * 60) // 7일
                .sameSite("Lax")
                .build();

        // [추가/변경할 코드]
        User user = userService.getUserByLoginId(loginId); // 유저 정보 조회
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("loginId", user.getLoginId());
        userMap.put("nickName", user.getNickName());
        userMap.put("userEmail", user.getUserEmail());
        userMap.put("profilePhoto", user.getProfilePhoto());
        userMap.put("introduction", user.getIntroduction());

        // 토큰과 유저 정보를 함께 반환, 쿠키 헤더 추가
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of(
                        "token", accessToken, // 프론트엔드 호환성을 위해 키 유지
                        "user", userMap));
    }

    @PostMapping("/signup/check-loginId")
    public ResponseEntity<?> checkLoginId(@RequestBody Map<String, String> request) {
        String loginId = request.get("loginId");
        boolean exists = userRepository.existsByLoginId(loginId);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PostMapping("/signup/check-nickname") // 또는 GET 방식도 가능
    public ResponseEntity<?> checkNickname(@RequestBody Map<String, String> request) {
        String nickName = request.get("nickName");
        boolean exists = userRepository.existsByNickName(nickName);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        if (refreshToken != null) {
            userService.logout(refreshToken);
        }

        // 쿠키 삭제 (수명을 0으로 설정)
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie
                .from("refreshToken", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0) // 즉시 만료
                .build();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("message", "로그아웃 되었습니다."));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        System.out.println(
                "[AuthController] Refresh requested. Cookie: " + (refreshToken != null ? "Present" : "Missing"));
        if (refreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("message", "리프레시 토큰이 없습니다."));
        }
        try {
            // [수정] UUID 기반 세션을 처리하는 refreshToken 메서드를 호출하도록 변경
            String newAccessToken = userService.refreshToken(refreshToken);
            System.out.println("[AuthController] Refresh Success");
            return ResponseEntity.ok(Map.of("token", newAccessToken));
        } catch (Exception e) {
            System.out.println("[AuthController] Refresh Failed: " + e.getMessage());
            return ResponseEntity.status(401).body(Map.of("message", "토큰 갱신 실패: " + e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        try {
            Long userId = Long.parseLong(request.get("userId"));
            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");

            userService.changePassword(userId, oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "비밀번호가 성공적으로 변경되었습니다."));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "잘못된 사용자 ID입니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestBody Map<String, String> request) {
        try {
            String id = userService.findLoginId(request.get("email"));
            return ResponseEntity.ok(Map.of("loginId", id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/verify-user")
    public ResponseEntity<?> verifyUser(@RequestBody Map<String, String> request) {
        try {
            userService.verifyUser(request.get("loginId"), request.get("email"), request.get("nickName"));
            return ResponseEntity.ok(Map.of("message", "사용자 확인 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            userService.resetPassword(
                    request.get("loginId"),
                    request.get("email"),
                    request.get("nickName"),
                    request.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "비밀번호가 재설정되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }
}
