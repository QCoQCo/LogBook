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

    // ID 목록으로 조회
    List<Post> findAllByIdIn(List<Long> ids);

    // userId로 유저의 모든 게시글을 조회 (활성만)
    @Query("""
    select new com.skull.logbook.dto.UserPostListDto(
            p.id,
            p.title,
            p.content,
            p.createdAt
        )
        from Post p
        where p.userId = :userId and p.deletedAt is null and p.isActive = true
        order by p.createdAt desc
    """)
    List<UserPostListDto> findPostListByUserId(
            @Param("userId") Long userId,
            Pageable pageable
    );

	List<Post> findAllByDeletedAtIsNullOrderByCreatedAtDesc(Pageable pageable);

	List<Post> findAllByDeletedAtIsNullAndIsActiveTrueOrderByCreatedAtDesc(Pageable pageable);

	long countByDeletedAtIsNull();

	long countByDeletedAtIsNullAndIsActiveTrue();

	List<Post> findByTitleContainingOrContentContainingOrderByCreatedAtDesc(String title, String content,
					Pageable pageable);

	List<Post> findByDeletedAtIsNullAndIsActiveTrueAndTitleContainingOrContentContainingOrderByCreatedAtDesc(
			String title, String content, Pageable pageable);

	List<Post> findByDeletedAtIsNullAndTitleContainingOrContentContainingOrderByCreatedAtDesc(
			String title, String content, Pageable pageable);

	@Query("SELECT DISTINCT p FROM Post p " +
					"JOIN PostTag pt ON p.id = pt.post.id " +
					"JOIN CommonCode cc ON pt.tagId = cc.codeValue " +
					"WHERE cc.codeName = :tagName AND p.deletedAt IS NULL AND p.isActive = true " +
					"ORDER BY p.createdAt DESC")
	List<Post> findByTagName(@Param("tagName") String tagName, Pageable pageable);

	@Query("SELECT DISTINCT p FROM Post p " +
					"JOIN PostTag pt ON p.id = pt.post.id " +
					"JOIN CommonCode cc ON pt.tagId = cc.codeValue " +
					"WHERE cc.codeName = :tagName AND p.deletedAt IS NULL " +
					"ORDER BY p.createdAt DESC")
	List<Post> findByTagNameIncludeInactive(@Param("tagName") String tagName, Pageable pageable);

    @Query("SELECT p.userId, COUNT(p.id) FROM Post p " +
            "WHERE p.deletedAt IS NULL GROUP BY p.userId ORDER BY COUNT(p.id) DESC")
    List<Object[]> countPostsByUserId();

    List<Post> findByUserIdInAndDeletedAtIsNullAndIsActiveTrueOrderByCreatedAtDesc(
            List<Long> userIds, Pageable pageable);

    long countByUserIdInAndDeletedAtIsNullAndIsActiveTrue(List<Long> userIds);
}
