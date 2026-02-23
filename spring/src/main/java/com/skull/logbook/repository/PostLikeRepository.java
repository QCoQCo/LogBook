package com.skull.logbook.repository;

import com.skull.logbook.entity.Post;
import com.skull.logbook.entity.PostLike;
import com.skull.logbook.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    long countByPost(Post post);

    boolean existsByPostAndUser(Post post, User user);

    @Query("SELECT COUNT(pl) > 0 FROM PostLike pl WHERE pl.post.id = :postId AND pl.user.id = :userId")
    boolean existsByPostIdAndUserId(@Param("postId") Long postId, @Param("userId") Long userId);

    void deleteByPostAndUser(Post post, User user);

    @Query("SELECT pl.post.id, COUNT(pl) FROM PostLike pl WHERE pl.post.id IN :postIds GROUP BY pl.post.id")
    List<Object[]> countLikesByPostIds(@Param("postIds") List<Long> postIds);

    @Query("SELECT pl.post.id FROM PostLike pl WHERE pl.user = :user ORDER BY pl.createdAt DESC")
    List<Long> findPostIdsByUser(@Param("user") User user, Pageable pageable);

    @Query("SELECT pl.post.id FROM PostLike pl WHERE pl.user = :user AND pl.post.id IN :postIds")
    List<Long> findPostIdsByUserAndPostIdIn(@Param("user") User user, @Param("postIds") List<Long> postIds);

    @Query("SELECT pl.post.id FROM PostLike pl WHERE pl.user.id = :userId AND pl.post.id IN :postIds")
    List<Long> findPostIdsByUserIdAndPostIdIn(@Param("userId") Long userId, @Param("postIds") List<Long> postIds);

    @Query("SELECT pl.post.id FROM PostLike pl WHERE pl.user.id = :userId ORDER BY pl.createdAt DESC")
    List<Long> findPostIdsByUserId(@Param("userId") Long userId, Pageable pageable);

    long countByUser(User user);

    @Query("SELECT COUNT(pl) FROM PostLike pl WHERE pl.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
}
