package com.skull.logbook.controller;

import com.skull.logbook.dto.CommentRequestDto;
import com.skull.logbook.entity.Comment;
import com.skull.logbook.security.PrincipalDetails;
import com.skull.logbook.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @PostMapping("/{postId}")
    public ResponseEntity<Long> addComment(
            @PathVariable Long postId,
            @RequestBody CommentRequestDto comment,
            @AuthenticationPrincipal PrincipalDetails principalDetails
    ) {
        Long commentId = commentService.insertComment(postId, comment, principalDetails.getId());

        return ResponseEntity.ok(commentId);
    }

    // 댓글 수정
    @PutMapping("/{commentId}")
    @PreAuthorize("@commentSecurity.isOwner(#commentId, principal.id)")
    public ResponseEntity<Void> updateComment(
            @PathVariable Long commentId,
            @RequestBody CommentRequestDto requestDto
    ) {
        commentService.updateComment(commentId, requestDto.getContent());
        return ResponseEntity.ok().build();
    }

    // 댓글 삭제 (소프트 딜리트)
    @DeleteMapping("/{commentId}")
    @PreAuthorize("@commentSecurity.isOwner(#commentId, principal.id)")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId
    ) {
        commentService.deleteComment(commentId);
        return ResponseEntity.ok().build();
    }

}
