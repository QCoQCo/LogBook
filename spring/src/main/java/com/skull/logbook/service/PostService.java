package com.skull.logbook.service;

import com.skull.logbook.dto.UserPostListDto;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.entity.Post;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.PostLikeRepository;
import com.skull.logbook.repository.PostRepository;
import com.skull.logbook.repository.UserFollowRepository;
import com.skull.logbook.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import java.util.List;

import com.skull.logbook.repository.PostTagRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {
        private final PostRepository postRepository;
        private final PostTagRepository postTagRepository;
        private final UserRepository userRepository;
        private final PostLikeRepository postLikeRepository;
        private final PostLikeService postLikeService;
        private final UserFollowRepository userFollowRepository;

        private User getCurrentUserOrNull() {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                        return null;
                }
                return userRepository.findByLoginId(auth.getName()).orElse(null);
        }

        public List<PostResponseDto> getAllPosts(int page, int size, boolean includeInactive, String filter) {
                if ("follow".equals(filter) || "liked".equals(filter)) {
                        User currentUser = getCurrentUserOrNull();
                        if (currentUser == null) {
                                return Collections.emptyList();
                        }
                        if ("follow".equals(filter)) {
                                return getPostsByFollowedUsers(currentUser, page, size);
                        }
                        return getPostsLikedByUser(currentUser, page, size);
                }

                List<Post> posts = includeInactive
                        ? postRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc(PageRequest.of(page, size))
                        : postRepository.findAllByDeletedAtIsNullAndIsActiveTrueOrderByCreatedAtDesc(PageRequest.of(page, size));

                return toPostResponseDtoList(posts, getCurrentUserOrNull());
        }

        public long countAll(boolean includeInactive) {
                return includeInactive
                        ? postRepository.countByDeletedAtIsNull()
                        : postRepository.countByDeletedAtIsNullAndIsActiveTrue();
        }

        public long countByFilter(String filter) {
                if (!"follow".equals(filter) && !"liked".equals(filter)) {
                        return countAll(false);
                }
                User currentUser = getCurrentUserOrNull();
                if (currentUser == null) return 0;
                if ("follow".equals(filter)) {
                        List<Long> followingIds = userFollowRepository.findFollowingIdsByFollower(currentUser);
                        if (followingIds.isEmpty()) return 0;
                        return postRepository.countByUserIdInAndDeletedAtIsNullAndIsActiveTrue(followingIds);
                }
                return postLikeRepository.countByUser(currentUser);
        }

        private List<PostResponseDto> getPostsByFollowedUsers(User currentUser, int page, int size) {
                List<Long> followingIds = userFollowRepository.findFollowingIdsByFollower(currentUser);
                if (followingIds.isEmpty()) {
                        return Collections.emptyList();
                }
                List<Post> posts = postRepository.findByUserIdInAndDeletedAtIsNullAndIsActiveTrueOrderByCreatedAtDesc(
                        followingIds, PageRequest.of(page, size));
                return toPostResponseDtoList(posts, currentUser);
        }

        private List<PostResponseDto> getPostsLikedByUser(User currentUser, int page, int size) {
                List<Long> postIds = postLikeRepository.findPostIdsByUser(currentUser, PageRequest.of(page, size));
                if (postIds.isEmpty()) {
                        return Collections.emptyList();
                }
                List<Post> posts = postRepository.findAllByIdIn(postIds);
                // 좋아요한 순서 유지 (createdAt DESC)
                Map<Long, Integer> orderMap = new java.util.HashMap<>();
                for (int i = 0; i < postIds.size(); i++) {
                        orderMap.put(postIds.get(i), i);
                }
                posts.sort((a, b) -> orderMap.getOrDefault(a.getId(), 999) - orderMap.getOrDefault(b.getId(), 999));
                return toPostResponseDtoList(posts, currentUser);
        }

        private List<PostResponseDto> toPostResponseDtoList(List<Post> posts, User currentUser) {
                if (posts.isEmpty()) return Collections.emptyList();

                List<Long> postIds = posts.stream().map(Post::getId).toList();
                List<Object[]> tagData = postTagRepository.findTagsByPostIds(postIds);
                Map<Long, List<String>> tagsMap = tagData.stream()
                        .collect(Collectors.groupingBy(data -> (Long) data[0],
                                Collectors.mapping(data -> (String) data[1], Collectors.toList())));

                List<Long> userIds = posts.stream().map(Post::getUserId).distinct().toList();
                Map<Long, String> authorNameMap = userRepository.findIdAndNickNameByIdIn(userIds).stream()
                        .collect(Collectors.toMap(
                                com.skull.logbook.repository.UserRepository.UserIdNickNameProjection::getId,
                                com.skull.logbook.repository.UserRepository.UserIdNickNameProjection::getNickName,
                                (a, b) -> a));

                Map<Long, Long> likeCountMap = Collections.emptyMap();
                List<Object[]> likeCountData = postLikeRepository.countLikesByPostIds(postIds);
                if (!likeCountData.isEmpty()) {
                        likeCountMap = likeCountData.stream()
                                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1], (a, b) -> a));
                }

                Set<Long> likedPostIds = postLikeService.getLikedPostIds(currentUser, postIds);
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
                                likedPostIds.contains(post.getId())
                        ))
                        .toList();
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
