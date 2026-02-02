package com.skull.logbook.service;

import com.skull.logbook.dto.SignupRequestDto;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.UserRepository;
import com.skull.logbook.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    // AuthenticationManagerBuilder는 Spring Security에서 인증을 처리하기 위해 필요합니다.
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

    // 로그인 기능: 토큰 반환
    public String login(String loginId, String password) {
        // 1. ID/PW 기반으로 Authentication 객체 생성
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(loginId,
                password);

        // 2. 실제 검증 (사용자 비밀번호 체크)
        // authenticate() 실행 시 CustomUserDetailsService.loadUserByUsername() 실행됨 (이건 잠시
        // 후에 만듭니다)
        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);

        // 3. 인증 정보를 기반으로 JWT 토큰 생성
        return jwtTokenProvider.createToken(authentication);
    }

    public User getUserByLoginId(String loginId) {
        return userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
    }
}