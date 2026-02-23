package com.skull.logbook.repository;

import com.skull.logbook.entity.Blog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {
    Optional<Blog> findByUserId(Long userId);

    /** loginId로 Blog + User 한 번에 조회 (N+1 및 중복 쿼리 방지) */
    @Query("SELECT b FROM Blog b JOIN FETCH b.user u WHERE u.loginId = :loginId")
    Optional<Blog> findByUserLoginIdWithUser(@Param("loginId") String loginId);
}
