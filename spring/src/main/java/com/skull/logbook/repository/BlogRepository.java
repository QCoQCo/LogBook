package com.skull.logbook.repository;

import com.skull.logbook.entity.Blog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlogRepository extends JpaRepository<Blog, Long> {
    Blog findByUserId(Long userId);
}
