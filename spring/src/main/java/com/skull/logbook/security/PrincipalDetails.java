package com.skull.logbook.security;

import com.skull.logbook.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@Getter
public class PrincipalDetails implements UserDetails, OAuth2User {

    private final User user;  // 기존 유지
    private Map<String, Object> attributes;

    // 🔥 JWT 전용 필드 추가 (기존 구조 안 깨짐)
    private Long id;
    private String username;
    private Collection<? extends GrantedAuthority> authorities;

    // --- 일반 로그인용 생성자 (기존 유지) ---
    public PrincipalDetails(User user) {
        this.user = user;
        this.id = user.getId();
        this.username = user.getLoginId();
        this.authorities =
                Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
                );
    }

    // --- 소셜 로그인용 생성자 (기존 유지) ---
    public PrincipalDetails(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
        this.id = user.getId();
        this.username = user.getLoginId();
        this.authorities =
                Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
                );
    }

    // JWT 전용 생성자 추가
    public PrincipalDetails(
            Long id,
            String username,
            Collection<? extends GrantedAuthority> authorities
    ) {
        this.user = null;  // 엔티티 없음
        this.id = id;
        this.username = username;
        this.authorities = authorities;
    }

    public User getUser() {
        if (user == null) {
            throw new IllegalStateException("JWT 기반 인증에서는 User 엔티티가 존재하지 않습니다.");
        }
        return user;
    }

    // --- OAuth2User 구현 ---
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public String getName() {
        return username;
    }

    // --- UserDetails 구현 ---
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    public Long getId() {
        return id;
    }

    @Override
    public String getPassword() {
        return user != null ? user.getPassword() : null;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}