package com.skull.logbook.security.oauth2;

import com.skull.logbook.security.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;


import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.oauth2.authorized-redirect-uris}")
    private String redirectUris;


    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        // JWT 토큰 생성
        String token = jwtTokenProvider.createToken(authentication);

        // 프론트엔드로 리다이렉트 (쿼리 파라미터로 토큰 전달)
        // 여러 리다이렉트 URI 중 적절한 것 선택
        String[] uris = redirectUris.split(",");
        String targetBaseUrl = uris[0]; // 기본값: 첫 번째 주소

        // 요청의 Referer를 확인하여 매칭되는 URI가 있는지 탐색
        String referer = request.getHeader("Referer");
        if (referer != null) {
            for (String uri : uris) {
                // URI의 프로토콜과 호스트 부분이 Referer에 포함되어 있는지 확인
                String cleanUri = uri.trim();
                if (referer.contains(cleanUri.replace("/oauth2/redirect", ""))) {
                    targetBaseUrl = cleanUri;
                    break;
                }
            }
        }

        String targetUrl = targetBaseUrl + "?token=" + token;
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
