package com.skull.logbook.controller;

import com.skull.logbook.dto.SignupRequestDto;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.UserRepository;
import com.skull.logbook.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequestDto requestDto) {
        Long userId = userService.signup(requestDto);
        return ResponseEntity.ok(Map.of("message", "회원가입 성공", "userId", userId));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String loginId = loginRequest.get("loginId");
        String password = loginRequest.get("password");

        String token = userService.login(loginId, password);

        // [추가/변경할 코드]
        User user = userService.getUserByLoginId(loginId); // 유저 정보 조회
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("loginId", user.getLoginId());
        userMap.put("nickName", user.getNickName());
        userMap.put("userEmail", user.getUserEmail());
        userMap.put("profilePhoto", user.getProfilePhoto());
        userMap.put("introduction", user.getIntroduction());
        // 토큰과 유저 정보를 함께 반환
        return ResponseEntity.ok(Map.of(
                "token", token,
                "user", userMap));
    }

    @PostMapping("/signup/check-nickname") // 또는 GET 방식도 가능
    public ResponseEntity<?> checkNickname(@RequestBody Map<String, String> request) {
        String nickName = request.get("nickName");
        boolean exists = userRepository.existsByNickName(nickName);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
