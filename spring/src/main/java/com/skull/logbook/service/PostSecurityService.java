package com.skull.logbook.service;

import com.skull.logbook.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component("postSecurity") // 이 이름이 @PreAuthorize에서 호출하는 이름이 됩니다.
@RequiredArgsConstructor
public class PostSecurityService {

    private final PostRepository postRepository;

    @Transactional(readOnly = true)
    public boolean isOwner(Long postId, Long userId) {
        if (postId == null || userId == null) {
            return false;
        }

        // 1. DB에서 실제 포스트를 조회 (이게 핵심 보안 포인트!)
        return postRepository.findById(postId)
                .map(post -> post.getUserId().equals(userId)) // 2. 실제 주인인지 대조
                .orElse(false); // 포스트가 없으면 false
    }
}