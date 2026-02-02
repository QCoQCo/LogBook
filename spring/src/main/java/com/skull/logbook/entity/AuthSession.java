package com.skull.logbook.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Table(name = "authSessions")
@EntityListeners(AuditingEntityListener.class)
public class AuthSession extends BaseUpdatedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String refreshTokenHash;

    @Column(nullable = false)
    private LocalDateTime issuedAt;

    @Column(nullable = false)
    private LocalDateTime lastUserAt;

    @Column(nullable = false)
    private LocalDateTime idleExpiredAt;

    @Column(nullable = false)
    private LocalDateTime absoluteExpiresAt;

    private LocalDateTime revokedAt;

    private Long replacedBySessionId;

    // 비즈니스 로직: 세션 연장 (마지막 사용 시간 & Idle 만료 시간 갱신)
    public void extendSession(long idleDurationHours) {
        this.lastUserAt = LocalDateTime.now();
        this.idleExpiredAt = LocalDateTime.now().plusHours(idleDurationHours);
    }

    // 비즈니스 로직: 세션 만료 여부 확인
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(absoluteExpiresAt) || LocalDateTime.now().isAfter(idleExpiredAt);
    }
}
