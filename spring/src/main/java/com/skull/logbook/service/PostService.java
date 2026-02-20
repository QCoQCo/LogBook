package com.skull.logbook.service;

import com.skull.logbook.dto.UserPostListDto;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.entity.Post;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.PostLikeRepository;
import com.skull.logbook.repository.PostRepository;
import com.skull.logbook.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import java.util.List; // Added import for List

import com.skull.logbook.repository.PostTagRepository; // Added import
import java.util.ArrayList;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {
        private final PostRepository postRepository;
        private final PostTagRepository postTagRepository;
        private final UserRepository userRepository;
        private final PostLikeRepository postLikeRepository;
        private final PostLikeService postLikeService;

        public List<PostResponseDto> getAllPosts(int page, int size, boolean includeInactive) {
                // 1. 게시글 목록 우선 조회 (관리자: 전체, 피드: 활성만)
                List<Post> posts = includeInactive
                        ? postRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc(PageRequest.of(page, size))
                        : postRepository.findAllByDeletedAtIsNullAndIsActiveTrueOrderByCreatedAtDesc(PageRequest.of(page, size));

                if (posts.isEmpty()) {
                        return Collections.emptyList();
                }

                // 2. 게시글 ID 목록 추출
                List<Long> postIds = posts.stream().map(Post::getId).toList();

                // 3. 태그 데이터 조회 및 매핑 (postId -> tagNames)
                List<Object[]> tagData = postTagRepository.findTagsByPostIds(postIds);
                Map<Long, List<String>> tagsMap = tagData.stream()
                                .collect(Collectors.groupingBy(
                                                data -> (Long) data[0],
                                                Collectors.mapping(data -> (String) data[1], Collectors.toList())));

                // 4. 작성자 닉네임 조회 (userId -> nickName)
                List<Long> userIds = posts.stream().map(Post::getUserId).distinct().toList();
                Map<Long, String> authorNameMap = userRepository.findAllById(userIds).stream()
                                .collect(Collectors.toMap(User::getId, User::getNickName, (a, b) -> a));

                // 5. 좋아요 수 조회
                Map<Long, Long> likeCountMap = Collections.emptyMap();
                List<Object[]> likeCountData = postLikeRepository.countLikesByPostIds(postIds);
                if (!likeCountData.isEmpty()) {
                        likeCountMap = likeCountData.stream()
                                        .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1], (a, b) -> a));
                }

                // 6. DTO 변환 (태그, 작성자명, 좋아요 수 주입)
                Map<Long, Long> finalLikeCountMap = likeCountMap;
                return posts.stream()
                                .map(post -> new PostResponseDto(
                                                post.getId(),
                                                String.valueOf(post.getUserId()),
                                                authorNameMap.getOrDefault(post.getUserId(), ""),
                                                post.getTitle(),
                                                post.getContent(),
                                                post.getCreatedAt().toString(),
                                                post.getUpdatedAt().toString(),
                                                tagsMap.getOrDefault(post.getId(), new ArrayList<>()),
                                                Boolean.TRUE.equals(post.getIsActive()),
                                                finalLikeCountMap.getOrDefault(post.getId(), 0L),
                                                false
                                ))
                                .toList();
        }

        public long countAll(boolean includeInactive) {
                return includeInactive
                        ? postRepository.countByDeletedAtIsNull()
                        : postRepository.countByDeletedAtIsNullAndIsActiveTrue();
        }

        @org.springframework.transaction.annotation.Transactional
        public void softDeletePost(Long postId) {
                Post post = postRepository.findById(postId)
                                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
                post.softDelete();
        }

        @org.springframework.transaction.annotation.Transactional
        public void deactivatePost(Long postId) {
                Post post = postRepository.findById(postId)
                                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
                if (post.isDeleted()) {
                        throw new IllegalArgumentException("삭제된 게시글입니다.");
                }
                post.setActive(false);
        }

        @org.springframework.transaction.annotation.Transactional
        public void activatePost(Long postId) {
                Post post = postRepository.findById(postId)
                                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
                if (post.isDeleted()) {
                        throw new IllegalArgumentException("삭제된 게시글입니다.");
                }
                post.setActive(true);
        }

        public PostResponseDto getPostDetail(Long postId, boolean includeInactive) {
                Post post = postRepository.findById(postId)
                                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + postId));
                if (post.isDeleted()) {
                        throw new IllegalArgumentException("삭제된 게시글입니다.");
                }
                if (!includeInactive && !Boolean.TRUE.equals(post.getIsActive())) {
                        throw new IllegalArgumentException("비활성화된 게시글입니다.");
                }

                // 작성자 닉네임 조회
                User author = userRepository.findById(post.getUserId())
                                .orElseThrow(() -> new IllegalArgumentException(
                                                "Author not found with id: " + post.getUserId()));

                List<Object[]> tagData = postTagRepository.findTagsByPostIds(Collections.singletonList(postId));
                List<String> tags = tagData.stream()
                                .map(data -> (String) data[1])
                                .collect(Collectors.toList());

                long likeCount = postLikeService.countLikes(postId);
                boolean isLiked = postLikeService.isLiked(postId);

                return new PostResponseDto(
                                post.getId(),
                                String.valueOf(post.getUserId()),
                                author.getNickName(),
                                post.getTitle(),
                                post.getContent(),
                                post.getCreatedAt().toString(),
                                post.getUpdatedAt().toString(),
                                tags,
                                Boolean.TRUE.equals(post.getIsActive()),
                                likeCount,
                                isLiked);
        }

        public List<UserPostListDto> getPostsByUserId(Long userId, Pageable pageable) {
                return postRepository.findPostListByUserId(userId, pageable);
        }
}
