package com.skull.logbook.service;

import com.skull.logbook.dto.SignupRequestDto;
import com.skull.logbook.dto.UserResponseDto;
import com.skull.logbook.entity.AuthSession;
import com.skull.logbook.entity.Blog;
import com.skull.logbook.constant.Role;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.BlogRepository;
import com.skull.logbook.repository.UserRepository;
import com.skull.logbook.repository.AuthSessionRepository;
import com.skull.logbook.security.JwtTokenProvider;
import com.skull.logbook.security.PrincipalDetails;
import lombok.RequiredArgsConstructor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.multipart.MultipartFile;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final BlogRepository blogRepository;
    private final AuthSessionRepository authSessionRepository; // [추가]
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManagerBuilder authenticationManagerBuilder;
    private final SftpService sftpService;

    private static final String DEFAULT_LAYOUT = """
            {
              "layout": [],
              "elements": []
            }
            """;

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

        Blog blog = Blog.builder()
                .user(user)
                .layout(DEFAULT_LAYOUT)
                .build();

        blogRepository.save(blog);

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
                .idleExpiredAt(java.time.LocalDateTime.now().plusDays(3)) // 3일
                .absoluteExpiresAt(java.time.LocalDateTime.now().plusDays(7)) // 7일
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

    public UserResponseDto getBlogOwner(String loginId) {
        return userRepository.findForUserResponseByLoginId(loginId)
                .map(p -> new UserResponseDto(
                        p.getId(),
                        p.getLoginId(),
                        p.getNickName(),
                        p.getUserEmail(),
                        p.getProfilePhoto(),
                        p.getIntroduction(),
                        p.getRole() != null ? p.getRole().name() : null))
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
    }

    /** 채팅/헤더 등에서 프로필 표시용 전체 사용자 목록 (공개 정보만, 삭제 제외, Blog N+1 방지) */
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAllForUserList().stream()
                .map(p -> new UserResponseDto(
                        p.getId(),
                        p.getLoginId(),
                        p.getNickName(),
                        p.getUserEmail(),
                        p.getProfilePhoto(),
                        p.getIntroduction(),
                        p.getRole() != null ? p.getRole().name() : null))
                .collect(Collectors.toList());
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
    public User updateUserProfile(Long userId, MultipartFile file, String introduction, String nickName)
            throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        // 닉네임 변경 시 중복 체크
        if (nickName != null && !nickName.equals(user.getNickName())) {
            if (userRepository.existsByNickName(nickName)) {
                throw new IllegalArgumentException("이미 존재하는 닉네임입니다.");
            }
        }

        String profilePhotoUrl = user.getProfilePhoto();

        // 파일이 있으면 저장 로직 수행 (SFTP)
        if (file != null && !file.isEmpty()) {
            profilePhotoUrl = sftpService.uploadFile(file, "profile", userId);
        }

        user.updateProfile(introduction, profilePhotoUrl, nickName);
        return user;
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

        // [추가] 세션 연장 (활동 했으므로 3일(72시간) 더 늘려줌)
        session.extendSession(72);

        // 세션 정보로 유저를 찾고 -> 새 Access Token 발급
        User user = userRepository.findById(session.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
        // Authentication 객체 임의 생성 (권한 정보 등 필요 시 로직 추가)
        // 여기서는 간단히 이름만 넣음
        PrincipalDetails principal = new PrincipalDetails(user);

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        principal.getAuthorities()
                );

        return jwtTokenProvider.createToken(authentication);
    }

    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("기존 비밀번호가 일치하지 않습니다.");
        }

        String encodedNewPassword = passwordEncoder.encode(newPassword);
        user.changePassword(encodedNewPassword);
    }

    // 아이디 찾기
    @Transactional(readOnly = true)
    public String findLoginId(String userEmail) {
        User user = userRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("입력하신 정보와 일치하는 사용자가 없습니다."));
        return user.getLoginId();
    }

    // 비밀번호 재설정 (아이디 + 이메일 검증 후 변경)
    @Transactional
    public void resetPassword(String loginId, String userEmail, String newPassword) {
        User user = userRepository.findByLoginIdAndUserEmail(loginId, userEmail)
                .orElseThrow(() -> new IllegalArgumentException("입력하신 정보와 일치하는 사용자가 없습니다."));

        String encodedNewPassword = passwordEncoder.encode(newPassword);
        user.changePassword(encodedNewPassword);
    }

    // 사용자 검증 (비밀번호 찾기 1단계: 아이디 + 이메일)
    @Transactional(readOnly = true)
    public void verifyUser(String loginId, String userEmail) {
        userRepository.findByLoginIdAndUserEmail(loginId, userEmail)
                .orElseThrow(() -> new IllegalArgumentException("입력하신 정보와 일치하는 사용자가 없습니다."));
    }

    /** 현재 로그인 사용자의 역할을 변경하고 새 토큰을 발급한다. (USER ↔ ADMIN) */
    @Transactional
    public Map<String, Object> updateMyRole(Role role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        String loginId = auth.getName();
        User user = getUserByLoginId(loginId);
        if (role != Role.USER && role != Role.ADMIN) {
            throw new IllegalArgumentException("USER 또는 ADMIN만 설정할 수 있습니다.");
        }
        user.changeRole(role);

        PrincipalDetails principal = new PrincipalDetails(user);

        Authentication newAuth =
                new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        principal.getAuthorities()
                );

        String newToken = jwtTokenProvider.createToken(newAuth);

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("loginId", user.getLoginId());
        userMap.put("nickName", user.getNickName());
        userMap.put("userEmail", user.getUserEmail());
        userMap.put("profilePhoto", user.getProfilePhoto());
        userMap.put("introduction", user.getIntroduction());
        userMap.put("role", user.getRole().name());

        return Map.of("token", newToken, "user", userMap);
    }

    /** 관리자: 특정 사용자의 역할 변경 */
    @Transactional
    public UserResponseDto updateUserRole(Long userId, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        if (user.isDeleted()) {
            throw new IllegalArgumentException("이미 삭제된 회원입니다.");
        }
        if (role != Role.USER && role != Role.ADMIN && role != Role.GUEST) {
            throw new IllegalArgumentException("USER, ADMIN, GUEST 중 하나여야 합니다.");
        }
        user.changeRole(role);
        return UserResponseDto.from(user);
    }

    /** 관리자: 특정 사용자의 닉네임, 이메일, 역할 수정 (null/빈 값은 변경하지 않음) */
    @Transactional
    public UserResponseDto updateUserByAdmin(Long userId, String nickName, String userEmail, Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        if (user.isDeleted()) {
            throw new IllegalArgumentException("이미 삭제된 회원입니다.");
        }
        if (nickName != null && !nickName.isBlank()) {
            if (!nickName.equals(user.getNickName()) && userRepository.existsByNickName(nickName)) {
                throw new IllegalArgumentException("이미 존재하는 닉네임입니다.");
            }
            user.updateProfile(null, null, nickName);
        }
        if (userEmail != null && !userEmail.isBlank()) {
            userRepository.findByUserEmail(userEmail)
                    .filter(other -> !other.getId().equals(userId))
                    .ifPresent(other -> {
                        throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
                    });
            user.updateUserEmail(userEmail);
        }
        if (role != null && (role == Role.USER || role == Role.ADMIN || role == Role.GUEST)) {
            user.changeRole(role);
        }
        return UserResponseDto.from(user);
    }

    /** 관리자: 사용자 소프트 삭제 */
    @Transactional
    public void softDeleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
        user.softDelete();
    }
}