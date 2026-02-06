package com.skull.logbook.repository;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.skull.logbook.entity.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 검색용 쿼리 (제목 or 내용)
    List<Post> findByTitleContainingOrContentContainingOrderByCreatedAtDesc(String title, String content,
            Pageable pageable);

    // ID 목록으로 조회
    List<Post> findAllByIdIn(List<Long> ids);
}
