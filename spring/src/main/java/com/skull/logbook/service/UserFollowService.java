package com.skull.logbook.service;

import com.skull.logbook.constant.NotificationType;
import com.skull.logbook.entity.User;
import com.skull.logbook.entity.UserFollow;
import com.skull.logbook.repository.UserFollowRepository;
import com.skull.logbook.repository.UserRepository;
import com.skull.logbook.security.PrincipalDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserFollowService {

    private final UserFollowRepository userFollowRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        String loginId = auth.getName();
        return userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new AccessDeniedException("존재하지 않는 회원입니다."));
    }

    /** JWT 인증 시 User 엔티티 로딩 없이 ID만 반환 (Blog N+1 방지) */
    private Long getCurrentUserIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof PrincipalDetails pd)) {
            return null;
        }
        return pd.getId();
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(Long targetUserId) {
        try {
            Long followerId = getCurrentUserIdOrNull();
            if (followerId == null) return false;
            return userFollowRepository.existsByFollowerIdAndFollowingId(followerId, targetUserId);
        } catch (AccessDeniedException e) {
            return false;
        }
    }

    @Transactional
    public void follow(Long targetUserId) {
        User follower = getCurrentUser();
        User following = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        if (follower.getId().equals(following.getId())) {
            throw new IllegalArgumentException("자기 자신은 팔로우할 수 없습니다.");
        }

        if (userFollowRepository.existsByFollowerAndFollowing(follower, following)) {
            throw new IllegalArgumentException("이미 팔로우 중입니다.");
        }

        UserFollow userFollow = UserFollow.builder()
                .follower(follower)
                .following(following)
                .build();
        userFollowRepository.save(userFollow);

        // 알림: 피팔로우 대상(following)에게 "OO님이 회원님을 팔로우했습니다."
        String title = "새 팔로워";
        String message = follower.getNickName() + "님이 회원님을 팔로우했습니다.";
        notificationService.createAndPush(
                NotificationType.FOLLOW,
                following.getId(),
                title,
                message,
                follower.getId()
        );
    }

    @Transactional
    public void unfollow(Long targetUserId) {
        User follower = getCurrentUser();
        User following = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        userFollowRepository.deleteByFollowerAndFollowing(follower, following);
    }
}
