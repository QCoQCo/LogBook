package com.skull.logbook.repository;

import com.skull.logbook.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c " +
            "JOIN FETCH c.user " +
            "WHERE c.post.id = :postId " +
            "ORDER BY c.createdAt ASC")
    List<Comment> findByPostIdWithUser(@Param("postId") Long postId);

    /** N+1 방지: User/Blog 엔티티 로딩 없이 projection으로 조회 */
    @Query("SELECT c.id AS id, u.nickName AS nickName, c.commentId AS commentId, c.content AS content, " +
            "c.createdAt AS createdAt, c.updatedAt AS updatedAt, c.deletedAt AS deletedAt " +
            "FROM Comment c JOIN c.user u WHERE c.post.id = :postId ORDER BY c.createdAt ASC")
    List<CommentProjection> findCommentsByPostId(@Param("postId") Long postId);

    interface CommentProjection {
        Long getId();
        String getNickName();
        Long getCommentId();
        String getContent();
        java.time.LocalDateTime getCreatedAt();
        java.time.LocalDateTime getUpdatedAt();
        java.time.LocalDateTime getDeletedAt();
    }
}
