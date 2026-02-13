package com.skull.logbook.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenProvider {

    private final Key key;
    // 토큰 유효시간: 6시간
    private final long tokenValidityInMilliseconds = 1000L * 60 * 60 * 6;

    // application.properties에 jwt.secret 값이 없으면 기본값 사용
    public JwtTokenProvider(
            @Value("${jwt.secret:default_secret_key_must_be_long_enough_for_hmac_sha_key_at_least_256_bits}") String secretKey) {
        if (secretKey.equals("default_secret_key_must_be_long_enough_for_hmac_sha_key_at_least_256_bits")) {
            this.key = Keys.hmacShaKeyFor(secretKey.getBytes());
        } else {
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            this.key = Keys.hmacShaKeyFor(keyBytes);
        }
    }

    // 1. 토큰 생성 (로그인 성공 시 호출)
    public String createToken(Authentication authentication) {
        String authorities = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        Claims claims = Jwts.claims().setSubject(authentication.getName());
        claims.put("auth", authorities);

        // PrincipalDetails 인 경우 추가 정보 포함
        if (authentication.getPrincipal() instanceof PrincipalDetails principal) {
            claims.put("email", principal.getUser().getUserEmail());
            claims.put("nickName", principal.getUser().getNickName());
            claims.put("profilePhoto", principal.getUser().getProfilePhoto());
            claims.put("userId", principal.getUser().getId());
        }

        long now = (new Date()).getTime();
        Date validity = new Date(now + tokenValidityInMilliseconds);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date(now))
                .setExpiration(validity)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // 2. 토큰에서 인증 정보 가져오기 (API 호출 시 호출)
    public Authentication getAuthentication(String accessToken) {
        Claims claims = parseClaims(accessToken);

        if (claims.get("auth") == null) {
            throw new RuntimeException("권한 정보가 없는 토큰입니다.");
        }

        Collection<? extends GrantedAuthority> authorities = Arrays.stream(claims.get("auth").toString().split(","))
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        UserDetails principal = new User(claims.getSubject(), "", authorities);
        return new UsernamePasswordAuthenticationToken(principal, "", authorities);
    }

    // 3. 토큰 유효성 검사 (필터에서 호출)
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
            log.info("잘못된 JWT 서명입니다.");
        } catch (ExpiredJwtException e) {
            log.info("만료된 JWT 토큰입니다.");
        } catch (UnsupportedJwtException e) {
            log.info("지원되지 않는 JWT 토큰입니다.");
        } catch (IllegalArgumentException e) {
            log.info("JWT 토큰이 잘못되었습니다.");
        }
        return false;
    }

    private Claims parseClaims(String accessToken) {
        try {
            return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(accessToken).getBody();
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }

    // 4. 토큰 연장 (활동 중인 사용자의 새 토큰 발행)
    public String refreshToken(String token) {
        Authentication authentication = getAuthentication(token);
        return createToken(authentication);
    }
}