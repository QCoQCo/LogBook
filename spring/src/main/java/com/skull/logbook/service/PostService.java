package com.skull.logbook.service;

import com.skull.logbook.dto.PostRequestDto;
import com.skull.logbook.dto.UserPostListDto;
import com.skull.logbook.entity.CommonCode;
import com.skull.logbook.entity.PostTag;
import com.skull.logbook.repository.*;
import com.skull.logbook.security.PrincipalDetails;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.entity.Post;
import com.skull.logbook.entity.User;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;
    private final PostTagRepository postTagRepository;
    private final UserRepository userRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostLikeService postLikeService;
    private final UserFollowRepository userFollowRepository;
    private final CommonCodeRepository commonCodeRepository;
    private final CommonCodeGroupRepository commonCodeGroupRepository;

    /**
     * JWT PrincipalDetails에서 userId 추출. DB 조회 없음.
     */
    private Long getCurrentUserIdOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof PrincipalDetails pd)) {
            return null;
        }
        return pd.getId();
    }

    @Transactional
    public Long createPost(PostRequestDto dto) {
        // 1. 게시글 본문 저장
        Post post = Post.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .userId(dto.getUserId())
                .isActive(true)
                .build();
        postRepository.save(post);

        // 2. 태그 처리
        if (dto.getTags() != null) {
            for (String tagName : dto.getTags()) {
                // (1) 공통 코드에서 태그 명칭으로 조회
                CommonCode tagCode = commonCodeRepository.findByCodeName(tagName)
                        .orElseGet(() -> {
                            // (2) 없으면 신규 코드 생성 (T + 숫자 채번)
                            String newCodeValue = generateNextTagCode();
                            return commonCodeRepository.save(CommonCode.builder()
                                    .codeGroup(commonCodeGroupRepository.findById("T")
                                            .orElseThrow(() -> new RuntimeException("공통코드 그룹 'T'(태그)가 DB에 존재하지 않습니다.")))
                                    .codeValue(newCodeValue)
                                    .codeName(tagName)
                                    .useYn("Y")
                                    .build());
                        });

                // (3) PostTag 매핑 테이블에 저장
                PostTag postTag = PostTag.builder()
                        .post(post)
                        .tagId(tagCode.getCodeValue()) // T001 등의 코드값 저장
                        .build();
                postTagRepository.save(postTag);
            }
        }
        return post.getId();
    }

    // 채번 로직: DB에서 현재 가장 큰 T값을 가져와 +1 함
    private String generateNextTagCode() {
        // 1. 숫자로 된 최댓값을 직접 가져옴 (예: 91)
        Integer maxNum = commonCodeRepository.findMaxNumericValueByGroupCode("T");

        // 2. 값이 없으면 1, 있으면 +1
        int nextNum = (maxNum == null) ? 1 : maxNum + 1;

        // 3. 다시 T를 붙여서 반환 (T1, T2... 형식 유지)
        return "T" + nextNum;
    }

    public List<PostResponseDto> getAllPosts(int page, int size, boolean includeInactive, String filter) {
        if ("follow".equals(filter) || "liked".equals(filter)) {
            Long currentUserId = getCurrentUserIdOrNull();
            if (currentUserId == null) {
                return Collections.emptyList();
            }
            if ("follow".equals(filter)) {
                return getPostsByFollowedUsers(currentUserId, page, size);
            }
            return getPostsLikedByUser(currentUserId, page, size);
        }

        List<Post> posts = includeInactive
                ? postRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc(PageRequest.of(page, size))
                : postRepository.findAllByDeletedAtIsNullAndIsActiveTrueOrderByCreatedAtDesc(PageRequest.of(page, size));

        return toPostResponseDtoList(posts, getCurrentUserIdOrNull());
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
        Long currentUserId = getCurrentUserIdOrNull();
        if (currentUserId == null) return 0;
        if ("follow".equals(filter)) {
            List<Long> followingIds = userFollowRepository.findFollowingIdsByFollowerId(currentUserId);
            if (followingIds.isEmpty()) return 0;
            return postRepository.countByUserIdInAndDeletedAtIsNullAndIsActiveTrue(followingIds);
        }
        return postLikeRepository.countByUserId(currentUserId);
    }

    private List<PostResponseDto> getPostsByFollowedUsers(Long currentUserId, int page, int size) {
        List<Long> followingIds = userFollowRepository.findFollowingIdsByFollowerId(currentUserId);
        if (followingIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<Post> posts = postRepository.findByUserIdInAndDeletedAtIsNullAndIsActiveTrueOrderByCreatedAtDesc(
                followingIds, PageRequest.of(page, size));
        return toPostResponseDtoList(posts, currentUserId);
    }

    private List<PostResponseDto> getPostsLikedByUser(Long currentUserId, int page, int size) {
        List<Long> postIds = postLikeRepository.findPostIdsByUserId(currentUserId, PageRequest.of(page, size));
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
        return toPostResponseDtoList(posts, currentUserId);
    }

    private List<PostResponseDto> toPostResponseDtoList(List<Post> posts, Long currentUserId) {
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

        Set<Long> likedPostIds = postLikeService.getLikedPostIds(currentUserId, postIds);
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

    @Transactional
    public void softDeletePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        post.softDelete();
    }

    @Transactional
    public void deactivatePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (post.isDeleted()) {
            throw new IllegalArgumentException("삭제된 게시글입니다.");
        }
        post.setActive(false);
    }

    @Transactional
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

    public Page<UserPostListDto> getPostsByUserId(Long userId, Pageable pageable) {
        return postRepository.findPostListByUserId(userId, pageable);
    }
}
