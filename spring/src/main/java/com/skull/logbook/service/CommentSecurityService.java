package com.skull.logbook.security;

import com.skull.logbook.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component("commentSecurity")
@RequiredArgsConstructor
public class CommentSecurityService {

    private final CommentRepository commentRepository;

    public boolean isOwner(Long commentId, Long userId) {
        return commentRepository.findById(commentId)
                .map(comment -> comment.getUser().getId().equals(userId))
                .orElse(false);
    }
}