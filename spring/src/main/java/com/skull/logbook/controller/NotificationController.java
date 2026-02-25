package com.skull.logbook.controller;

import com.skull.logbook.dto.NotificationResponseDto;
import com.skull.logbook.security.PrincipalDetails;
import com.skull.logbook.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<NotificationResponseDto>> getMyNotifications(
            @AuthenticationPrincipal PrincipalDetails principal,
            @PageableDefault(size = 20) Pageable pageable) {
        Long userId = principal.getId();
        return ResponseEntity.ok(notificationService.getMyNotifications(userId, pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal PrincipalDetails principal) {
        Long userId = principal.getId();
        return ResponseEntity.ok(notificationService.getUnreadCount(userId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal PrincipalDetails principal,
            @PathVariable Long id) {
        Long userId = principal.getId();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal PrincipalDetails principal) {
        Long userId = principal.getId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
}
