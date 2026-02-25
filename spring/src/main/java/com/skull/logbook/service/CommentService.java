package com.skull.logbook.service;

import com.skull.logbook.constant.NotificationType;
import com.skull.logbook.dto.CommentRequestDto;
import com.skull.logbook.dto.CommentResponseDto;
import com.skull.logbook.entity.Comment;
import com.skull.logbook.entity.Post;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.CommentRepository;
import com.skull.logbook.repository.PostRepository;
import com.skull.logbook.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<CommentResponseDto> getCommentsByPostId(Long postId) {
        List<CommentRepository.CommentProjection> projections = commentRepository.findCommentsByPostId(postId);

        return projections.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    private CommentResponseDto convertToResponseDto(CommentRepository.CommentProjection p) {
        boolean isDeleted = p.getDeletedAt() != null;
        return new CommentResponseDto(
                p.getId(),
                p.getNickName(),
                p.getCommentId(),
                isDeleted ? "삭제된 댓글입니다." : p.getContent(),
                p.getCreatedAt(),
                p.getUpdatedAt(),
                p.getDeletedAt()
        );
    }

    @Transactional
    public Long insertComment(Long postId, CommentRequestDto requestDto, Long userId) {
        // 1. 작성자(User) 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 2. 게시글(Post) 조회
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));

        // 3. 엔티티 생성 (Builder 사용)
        Comment comment = Comment.builder()
                .content(requestDto.getContent())
                .commentId(requestDto.getCommentId()) // 부모 댓글 ID (null 허용)
                .user(user)
                .post(post)
                .build();

        // 4. 저장 및 ID 반환
        Long commentId = commentRepository.save(comment).getId();

        // 5. 알림: 게시글 작성자에게 (본인 댓글 제외)
        Long postAuthorId = post.getUserId();
        if (!postAuthorId.equals(userId)) {
            String title = "새 댓글";
            String message = user.getNickName() + "님이 회원님의 게시글에 댓글을 남겼습니다.";
            notificationService.createAndPush(
                    NotificationType.COMMENT,
                    postAuthorId,
                    title,
                    message,
                    postId
            );
        }

        return commentId;
    }

    @Transactional
    public void updateComment(Long commentId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // 엔티티에 업데이트 메서드가 없다면 생성하거나 직접 세팅
        // (Comment 엔티티에 @Setter가 없으므로 별도의 변경 메서드 권장)
        comment.updateContent(content);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        // BaseDeletedEntity의 기능을 활용하여 삭제 시간 기록
        comment.softDelete();
    }
}
