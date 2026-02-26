package com.skull.logbook.entity;

import com.skull.logbook.constant.NotificationType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@Table(name = "notification")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notification extends BaseCreatedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    /** 관련 ID (postId, reportId, followerId 등) */
    @Column(name = "related_id")
    private Long relatedId;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Builder
    public Notification(User user, NotificationType type, String title, String message, Long relatedId) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.relatedId = relatedId;
    }

    public void markAsRead() {
        this.readAt = LocalDateTime.now();
    }
}
