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

    void deleteByPostAndUser(Post post, User user);

    @Query("SELECT pl.post.id, COUNT(pl) FROM PostLike pl WHERE pl.post.id IN :postIds GROUP BY pl.post.id")
    List<Object[]> countLikesByPostIds(@Param("postIds") List<Long> postIds);

    @Query("SELECT pl.post.id FROM PostLike pl WHERE pl.user = :user ORDER BY pl.createdAt DESC")
    List<Long> findPostIdsByUser(@Param("user") User user, Pageable pageable);

    @Query("SELECT pl.post.id FROM PostLike pl WHERE pl.user = :user AND pl.post.id IN :postIds")
    List<Long> findPostIdsByUserAndPostIdIn(@Param("user") User user, @Param("postIds") List<Long> postIds);

    long countByUser(User user);
}
