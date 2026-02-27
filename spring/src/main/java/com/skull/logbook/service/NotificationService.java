package com.skull.logbook.service;

import com.skull.logbook.constant.NotificationType;
import com.skull.logbook.dto.NotificationResponseDto;
import com.skull.logbook.entity.Notification;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.NotificationRepository;
import com.skull.logbook.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String NOTIFICATION_DESTINATION = "/queue/notifications";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 알림 생성 후 DB 저장 + WebSocket 실시간 푸시
     * @param commentId 댓글 알림 시 해당 댓글 ID (COMMENT 타입 전용, null 가능)
     */
    @Transactional
    public Notification createAndPush(NotificationType type, Long recipientUserId,
                                      String title, String message, Long relatedId, Long commentId) {
        User user = userRepository.findById(recipientUserId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .relatedId(relatedId)
                .commentId(commentId)
                .build();
        notification = notificationRepository.save(notification);

        // WebSocket 푸시 (Principal name = loginId 사용)
        NotificationResponseDto dto = NotificationResponseDto.from(notification);
        messagingTemplate.convertAndSendToUser(user.getLoginId(), NOTIFICATION_DESTINATION, dto);

        return notification;
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponseDto> getMyNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationResponseDto::from);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadAtIsNull(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 알림입니다."));
        if (!notification.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 알림만 읽음 처리할 수 있습니다.");
        }
        notification.markAsRead();
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, Pageable.unpaged())
                .getContent()
                .stream()
                .filter(n -> n.getReadAt() == null)
                .forEach(Notification::markAsRead);
    }
}
