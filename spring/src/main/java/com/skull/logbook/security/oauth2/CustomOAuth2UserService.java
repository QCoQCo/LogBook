package com.skull.logbook.security.oauth2;

import com.skull.logbook.constant.AuthProvider;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.UserRepository;
import com.skull.logbook.security.PrincipalDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        // 제공자 식별 (google 등)
        String provider = userRequest.getClientRegistration().getRegistrationId();

        OAuth2UserInfo oAuth2UserInfo = null;
        if (provider.equals("google")) {
            oAuth2UserInfo = new GoogleUserInfo(oAuth2User.getAttributes());
        }

        if (oAuth2UserInfo == null) {
            throw new OAuth2AuthenticationException("지원하지 않는 소셜 로그인입니다.");
        }

        final OAuth2UserInfo finalUserInfo = oAuth2UserInfo; // 람다식 사용을 위해 effectively final 변수 생성
        String providerId = oAuth2UserInfo.getProviderId();
        String email = oAuth2UserInfo.getEmail();
        String loginId = provider + "_" + providerId; // 소셜 로그인용 유니크 아이디 생성

        // 유저 찾기 또는 생성
        User user = userRepository.findByUserEmail(email)
                .map(existingUser -> {
                    // 이미 가입된 유저라면 정보 업데이트 (선택 사항)
                    return existingUser;
                })
                .orElseGet(() -> {
                    // 신규 가입
                    return userRepository.save(User.builder()
                            .loginId(loginId)
                            .password(UUID.randomUUID().toString()) // 소셜 유저는 랜덤 비밀번호 설정
                            .nickName(finalUserInfo.getName())
                            .userEmail(email)
                            .profilePhoto(finalUserInfo.getImageUrl())
                            .provider(AuthProvider.GOOGLE)
                            .providerId(providerId)
                            .build());
                });

        return new PrincipalDetails(user, oAuth2User.getAttributes());
    }
}
