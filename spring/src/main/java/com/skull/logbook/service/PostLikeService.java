package com.skull.logbook.service;

import com.skull.logbook.entity.Post;
import com.skull.logbook.entity.PostLike;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.PostLikeRepository;
import com.skull.logbook.repository.PostRepository;
import com.skull.logbook.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PostLikeService {

    private final PostLikeRepository postLikeRepository;
    private final PostRepository postRepository;
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
    public boolean isLiked(Long postId) {
        try {
            User user = getCurrentUser();
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
            return postLikeRepository.existsByPostAndUser(post, user);
        } catch (AccessDeniedException e) {
            return false;
        }
    }

    /**
     * 배치 조회: 주어진 postIds 중 해당 사용자가 좋아요한 postId 목록 반환.
     * N+1 방지를 위해 목록 조회 시 사용. userId만 사용하여 User 엔티티 로딩 불필요.
     */
    @Transactional(readOnly = true)
    public Set<Long> getLikedPostIds(Long userId, List<Long> postIds) {
        if (userId == null || postIds == null || postIds.isEmpty()) {
            return Collections.emptySet();
        }
        List<Long> liked = postLikeRepository.findPostIdsByUserIdAndPostIdIn(userId, postIds);
        return Set.copyOf(liked);
    }

    @Transactional(readOnly = true)
    public long countLikes(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        return postLikeRepository.countByPost(post);
    }

    @Transactional
    public void like(Long postId) {
        User user = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        if (post.isDeleted()) {
            throw new IllegalArgumentException("삭제된 게시글입니다.");
        }

        if (postLikeRepository.existsByPostAndUser(post, user)) {
            throw new IllegalArgumentException("이미 좋아요를 누른 게시글입니다.");
        }

        PostLike postLike = PostLike.builder()
                .post(post)
                .user(user)
                .build();
        postLikeRepository.save(postLike);
    }

    @Transactional
    public void unlike(Long postId) {
        User user = getCurrentUser();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        postLikeRepository.deleteByPostAndUser(post, user);
    }
}
