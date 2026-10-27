package com.skull.logbook.controller;

import com.skull.logbook.dto.SignupRequestDto;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.UserRepository;
import com.skull.logbook.service.BlogService;
import com.skull.logbook.service.UserService;
import com.skull.logbook.security.PrincipalDetails;
import com.skull.logbook.security.RefreshTokenCookieFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final BlogService blogService;
    private final com.skull.logbook.service.MailService mailService;
    private final RefreshTokenCookieFactory refreshTokenCookieFactory;

    @PostMapping("/email/send")
    public ResponseEntity<Map<String, String>> sendEmail(@RequestBody com.skull.logbook.dto.EmailRequest request) {
        mailService.sendAuthMail(request.getEmail());
        return ResponseEntity.ok(Map.of("message", "인증 코드가 전송되었습니다."));
    }

    @PostMapping("/email/verify")
    public ResponseEntity<Map<String, Object>> verifyEmail(
            @RequestBody com.skull.logbook.dto.EmailVerifyRequest request) {
        String token = mailService.verifyEmailCode(request.getEmail(), request.getCode());

        if (token != null) {
            return ResponseEntity.ok(Map.of("verified", true, "token", token));
        } else {
            return ResponseEntity.badRequest().body(Map.of("verified", false, "message", "인증 코드가 올바르지 않거나 만료되었습니다."));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequestDto requestDto) {
        // 이메일 인증 완료 여부를 서버에서 확인 (프론트 검증만으로는 우회 가능)
        // 중복 아이디 등으로 가입이 실패해도 재인증하지 않도록, 가입 성공 후에 토큰을 소모
        String verifiedEmail = mailService.getVerifiedEmail(requestDto.getVerificationToken());
        if (verifiedEmail == null || !verifiedEmail.equals(requestDto.getUserEmail())) {
            return ResponseEntity.status(401).body(Map.of("message", "이메일 인증이 필요합니다."));
        }
        Long userId = userService.signup(requestDto);
        mailService.consumeToken(requestDto.getVerificationToken());
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
        org.springframework.http.ResponseCookie cookie = refreshTokenCookieFactory.create(refreshToken);

        // [추가/변경할 코드]
        User user = userService.getUserByLoginId(loginId); // 유저 정보 조회
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("loginId", user.getLoginId());
        userMap.put("nickName", user.getNickName());
        userMap.put("userEmail", user.getUserEmail());
        userMap.put("profilePhoto", user.getProfilePhoto());
        userMap.put("introduction", user.getIntroduction());
        userMap.put("role", user.getRole().name());

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

    @PostMapping("/signup/check-email")
    public ResponseEntity<?> checkEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        boolean exists = userRepository.existsByUserEmail(email);
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
        org.springframework.http.ResponseCookie cookie = refreshTokenCookieFactory.expire();
        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("message", "로그아웃 되었습니다."));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null) {
            return ResponseEntity.status(401).body(Map.of("message", "리프레시 토큰이 없습니다."));
        }
        try {
            // [수정] UUID 기반 세션을 처리하는 refreshToken 메서드를 호출하도록 변경
            String newAccessToken = userService.refreshToken(refreshToken);
            return ResponseEntity.ok(Map.of("token", newAccessToken));
        } catch (IllegalArgumentException e) {
            log.info("Refresh 실패: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("message", "토큰 갱신 실패: " + e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal PrincipalDetails principal) {
        // 본문의 userId가 아닌 로그인 토큰의 사용자만 변경 가능
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("message", "로그인이 필요합니다."));
        }
        try {
            Long userId = principal.getId();
            String oldPassword = request.get("oldPassword");
            String newPassword = request.get("newPassword");

            userService.changePassword(userId, oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "비밀번호가 성공적으로 변경되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestBody Map<String, String> request) {
        // 아이디는 응답으로 돌려주지 않고 해당 이메일로만 발송 (가입 여부도 노출하지 않음)
        String email = request.get("email");
        try {
            String id = userService.findLoginId(email);
            mailService.sendLoginIdMail(email, id);
        } catch (IllegalArgumentException e) {
            log.info("아이디 찾기: 일치하는 사용자 없음");
        }
        return ResponseEntity.ok(Map.of("message", "입력하신 이메일로 가입된 계정이 있다면 아이디를 발송했습니다."));
    }

    @PostMapping("/verify-user")
    public ResponseEntity<?> verifyUser(@RequestBody Map<String, String> request) {
        try {
            userService.verifyUser(request.get("loginId"), request.get("email"));
            return ResponseEntity.ok(Map.of("message", "사용자 확인 성공"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            // [New] Token verification
            String verificationToken = request.get("verificationToken");
            if (verificationToken == null) {
                return ResponseEntity.status(401).body(Map.of("message", "인증 토큰이 필요합니다."));
            }

            String verifiedEmail = mailService.verifyToken(verificationToken);
            if (verifiedEmail == null) {
                return ResponseEntity.status(401).body(Map.of("message", "유효하지 않거나 만료된 인증 토큰입니다."));
            }

            String requestedEmail = request.get("email");
            if (!verifiedEmail.equals(requestedEmail)) {
                return ResponseEntity.status(401).body(Map.of("message", "인증된 이메일과 요청된 이메일이 일치하지 않습니다."));
            }

            userService.resetPassword(
                    request.get("loginId"),
                    request.get("email"),
                    request.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "비밀번호가 재설정되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }
}
