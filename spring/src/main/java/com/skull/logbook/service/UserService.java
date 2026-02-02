package com.skull.logbook.service;

import com.skull.logbook.dto.SignupRequestDto;
import com.skull.logbook.entity.AuthSession;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.UserRepository;
import com.skull.logbook.repository.AuthSessionRepository;
import com.skull.logbook.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;
import java.util.Base64;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuthSessionRepository authSessionRepository; // [추가]
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;

    public Long signup(SignupRequestDto requestDto) {
        if (userRepository.findByLoginId(requestDto.getLoginId()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }

        if (userRepository.findByUserEmail(requestDto.getUserEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        // 닉네임 중복 체크
        if (userRepository.existsByNickName(requestDto.getNickName())) {
            throw new IllegalArgumentException("이미 존재하는 닉네임입니다.");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(requestDto.getPassword());

        User user = User.builder()
                .loginId(requestDto.getLoginId())
                .password(encodedPassword) // 암호화된 비밀번호 저장
                .nickName(requestDto.getNickName())
                .userEmail(requestDto.getUserEmail())
                .introduction(requestDto.getIntroduction())
                // phone은 Entity에 없으므로 저장하지 않음 (필요 시 다른 테이블 사용 등 고려)
                .build();

        userRepository.save(user);

        return user.getId();
    }

    // 로그인 기능: Access Token, Refresh Token 반환
    public Map<String, String> login(String loginId, String password) {
        // 1. ID/PW 기반으로 Authentication 객체 생성
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(loginId,
                password);

        // 2. 실제 검증 (사용자 비밀번호 체크)
        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);

        // 3. 인증 정보를 기반으로 JWT 토큰 생성 (Access Token)
        String accessToken = jwtTokenProvider.createToken(authentication);

        // 4. Refresh Token 생성 및 세션 저장
        User user = getUserByLoginId(loginId);
        String refreshToken = java.util.UUID.randomUUID().toString();
        // String refreshTokenHash = passwordEncoder.encode(refreshToken); // 해시해서 저장
        String refreshTokenHash = hashToken(refreshToken);

        AuthSession session = AuthSession.builder()
                .userId(user.getId())
                .refreshTokenHash(refreshTokenHash)
                .issuedAt(java.time.LocalDateTime.now())
                .lastUserAt(java.time.LocalDateTime.now())
                .idleExpiredAt(java.time.LocalDateTime.now().plusHours(3)) // 예: 3시간
                .absoluteExpiresAt(java.time.LocalDateTime.now().plusDays(2)) // 예: 3일
                .build();

        authSessionRepository.save(session);

        Map<String, String> tokens = new HashMap<>();
        tokens.put("accessToken", accessToken);
        tokens.put("refreshToken", refreshToken); // Raw 토큰은 사용자에게만 전달

        return tokens;
    }

    @Transactional
    public void logout(String refreshToken) {
        String refreshTokenHash = hashToken(refreshToken);
        // 토큰으로 세션 찾아서 만료(Revoke) 처리
        authSessionRepository.findByRefreshTokenHash(refreshTokenHash)
                .ifPresent(session -> {
                    // Update Query가 날아가도록 Entity에 setter나 메서드가 필요할 수 있음
                    // 여기서는 간단히 Repository에서 Custom Query를 쓰거나,
                    // Entity에 updateRevokedAt() 같은 메서드를 추가해야 함.
                    // (일단 Entity에 setter가 없으므로 아래와 같이 가정)
                    // session.revoke();
                });
        // *주의: AuthSession Entity에 'revokedAt'을 변경하는 메서드가 필요합니다!
    }

    public User getUserByLoginId(String loginId) {
        return userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    @Transactional
    public String refreshToken(String refreshToken) {
        String refreshTokenHash = hashToken(refreshToken);

        AuthSession session = authSessionRepository.findByRefreshTokenHash(refreshTokenHash)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다."));

        if (session.isExpired()) {
            throw new IllegalArgumentException("만료된 세션입니다.");
        }
        if (session.getRevokedAt() != null) {
            throw new IllegalArgumentException("폐기된 세션입니다.");
        }
        // 세션 정보로 유저를 찾고 -> 새 Access Token 발급
        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        // Authentication 객체 임의 생성 (권한 정보 등 필요 시 로직 추가)
        // 여기서는 간단히 이름만 넣음
        UserDetails principal = org.springframework.security.core.userdetails.User
                .builder()
                .username(user.getLoginId())
                .password("")
                .authorities("ROLE_USER") // 기본 권한 부여
                .build();

        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, "",
                principal.getAuthorities());
        return jwtTokenProvider.createToken(authentication);
    }
}