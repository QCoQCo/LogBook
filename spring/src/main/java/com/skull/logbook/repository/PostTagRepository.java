package com.skull.logbook.repository;

import com.skull.logbook.entity.PostTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostTagRepository extends JpaRepository<PostTag, Long> {
    @Query("SELECT pt.post.id, c.codeName " +
            "FROM PostTag pt " +
            "JOIN CommonCode c ON pt.tagId = c.codeValue " +
            "WHERE pt.post.id IN :postIds " +
            "ORDER BY c.sortOrder ASC")
    List<Object[]> findTagsByPostIds(@Param("postIds") List<Long> postIds);

    // 태그 이름(유사)으로 게시글 ID 조회
    @Query("SELECT DISTINCT pt.post.id FROM PostTag pt JOIN CommonCode c ON pt.tagId = c.codeValue WHERE c.codeName IN :tagNames")
    List<Long> findPostIdsByTagNames(@Param("tagNames") List<String> tagNames);
}
