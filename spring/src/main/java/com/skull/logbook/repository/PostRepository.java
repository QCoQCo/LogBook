package com.skull.logbook.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.skull.logbook.entity.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {

        List<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

        List<Post> findAllByDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

        long countByDeletedAtIsNull();

        List<Post> findByTitleContainingOrContentContainingOrderByCreatedAtDesc(String title, String content,
                        Pageable pageable);

        List<Post> findAllByIdIn(List<Long> ids);

        @Query("SELECT DISTINCT p FROM Post p " +
                        "JOIN PostTag pt ON p.id = pt.post.id " +
                        "JOIN CommonCode cc ON pt.tagId = cc.codeValue " +
                        "WHERE cc.codeName = :tagName " +
                        "ORDER BY p.createdAt DESC")
        List<Post> findByTagName(@Param("tagName") String tagName, Pageable pageable);
}
