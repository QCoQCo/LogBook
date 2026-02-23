package com.skull.logbook.service;

import com.skull.logbook.entity.User;
import com.skull.logbook.entity.UserFollow;
import com.skull.logbook.repository.UserFollowRepository;
import com.skull.logbook.repository.UserRepository;
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

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        String loginId = auth.getName();
        return userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new AccessDeniedException("존재하지 않는 회원입니다."));
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(Long targetUserId) {
        try {
            User follower = getCurrentUser();
            User following = userRepository.findById(targetUserId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));
            return userFollowRepository.existsByFollowerAndFollowing(follower, following);
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
    }

    @Transactional
    public void unfollow(Long targetUserId) {
        User follower = getCurrentUser();
        User following = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 회원입니다."));

        userFollowRepository.deleteByFollowerAndFollowing(follower, following);
    }
}
