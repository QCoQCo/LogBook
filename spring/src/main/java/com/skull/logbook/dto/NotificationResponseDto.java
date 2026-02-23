package com.skull.logbook.dto;

import com.skull.logbook.constant.NotificationType;
import com.skull.logbook.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDto {
    private Long id;
    private NotificationType type;
    private String title;
    private String message;
    private Long relatedId;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;

    public static NotificationResponseDto from(Notification notification) {
        return new NotificationResponseDto(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getRelatedId(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }
}
