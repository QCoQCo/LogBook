package com.skull.logbook.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * refreshToken HttpOnly 쿠키 생성/삭제를 한 곳에서 관리.
 * 발급과 삭제의 속성(path, secure, sameSite)이 다르면 브라우저가 쿠키를 지우지 못하므로 공통으로 사용한다.
 */
@Component
public class RefreshTokenCookieFactory {

    private static final String COOKIE_NAME = "refreshToken";
    private static final Duration MAX_AGE = Duration.ofDays(7);

    // 운영이 HTTPS로 전환되면 COOKIE_SECURE=true 로 설정 (현재 운영은 HTTP라 기본 false)
    private final boolean secure;

    public RefreshTokenCookieFactory(@Value("${app.cookie.secure:false}") boolean secure) {
        this.secure = secure;
    }

    public ResponseCookie create(String refreshToken) {
        return base(refreshToken).maxAge(MAX_AGE).build();
    }

    public ResponseCookie expire() {
        return base("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite("Lax");
    }
}
