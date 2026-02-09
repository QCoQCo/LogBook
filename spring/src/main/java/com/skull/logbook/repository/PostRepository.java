package com.skull.logbook.repository;

import java.util.List;

import com.skull.logbook.dto.UserPostListDto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    // userId로 유저의 모든 게시글을 조회
    @Query("""
    select new com.skull.logbook.dto.UserPostListDto(
            p.id,
            p.title,
            p.content,
            p.createdAt
        )
        from Post p
        where p.userId = :userId
        order by p.createdAt desc
    """)
    List<UserPostListDto> findPostListByUserId(
            @Param("userId") Long userId,
            Pageable pageable
    );
}
