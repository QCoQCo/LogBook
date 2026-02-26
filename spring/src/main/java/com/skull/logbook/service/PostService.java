package com.skull.logbook.service;

import com.skull.logbook.dto.PostRequestDto;
import com.skull.logbook.dto.UserPostListDto;
import com.skull.logbook.entity.*;
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
    public Long createPost(PostRequestDto dto, Long userId) {
        // 1. 게시글 본문 저장
        Post post = Post.builder()
                .title(dto.getTitle())
                .content(dto.getContent())
                .userId(userId)
                .isActive(true)
                .build();
        postRepository.save(post);

        // 2. 태그 처리 (공통 메서드 재사용)
        if (dto.getTags() != null) {
            for (String tagName : dto.getTags()) {
                // 재사용 메서드 호출
                CommonCode tagCode = getOrCreateTagCode(tagName);

                // PostTag 매핑 객체 생성 및 리스트에 추가
                PostTag postTag = PostTag.builder()
                        .post(post)
                        .tagId(tagCode.getCodeValue())
                        .build();

                // Post 엔티티 내부의 List<PostTag>에 추가 (CascadeType.ALL로 인해 자동 저장)
                post.getPostTags().add(postTag);
            }
        }
        return post.getId();
    }

    @Transactional
    public void updatePost(Long postId, PostRequestDto dto, Long userId) {
        // 1. 게시글 조회 및 기본 정보 수정
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        post.update(dto.getTitle(), dto.getContent());

        // 2. 태그 업데이트 (핵심)
        updatePostTags(post, dto.getTags());
    }

    private void updatePostTags(Post post, List<String> newTagNames) {
        // 1) 기존 이 게시글에 등록된 PostTag 리스트 가져오기
        List<PostTag> currentPostTags = post.getPostTags();

        // 2) 삭제된 태그 처리
        // 화면에서 넘어온 newTagNames에 없는 기존 태그는 삭제
        currentPostTags.removeIf(postTag -> {
            // PostTag의 tagId를 이용해 CommonCode의 Name을 찾거나, 직접 대조
            CommonCode code = commonCodeRepository.findById(postTag.getTagId()).orElse(null);
            return code == null || !newTagNames.contains(code.getCodeName());
        });

        // 3) 추가된 태그 처리
        List<String> currentTagNames = currentPostTags.stream()
                .map(pt -> commonCodeRepository.findById(pt.getTagId()).map(CommonCode::getCodeName).orElse(""))
                .toList();

        for (String tagName : newTagNames) {
            if (!currentTagNames.contains(tagName)) {
                // 신규 태그라면 CommonCode 조회/생성 (Create 로직 재사용)
                CommonCode tagCode = getOrCreateTagCode(tagName);

                // PostTag 매핑 생성
                PostTag newPostTag = PostTag.builder()
                        .post(post)
                        .tagId(tagCode.getCodeValue())
                        .build();
                currentPostTags.add(newPostTag); // orphanRemoval에 의해 관리됨
            }
        }
    }

    // 태그 조회 및 생성 로직 분리 (재사용성)
    private CommonCode getOrCreateTagCode(String tagName) {
        return commonCodeRepository.findByCodeName(tagName)
                .orElseGet(() -> {
                    String newCodeValue = generateNextTagCode();
                    CommonCodeGroup group = commonCodeGroupRepository.findById("T")
                            .orElseThrow(() -> new RuntimeException("태그 그룹이 없습니다."));

                    return commonCodeRepository.save(CommonCode.builder()
                            .codeGroup(group)
                            .codeValue(newCodeValue)
                            .codeName(tagName)
                            .useYn("Y")
                            .build());
                });
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
        var authorData = userRepository.findIdNickNameLoginIdByIdIn(userIds).stream()
                .collect(Collectors.toMap(
                        com.skull.logbook.repository.UserRepository.UserIdNickNameLoginIdProjection::getId,
                        p -> p,
                        (a, b) -> a));
        Map<Long, String> authorNameMap = new java.util.HashMap<>();
        Map<Long, String> authorLoginIdMap = new java.util.HashMap<>();
        authorData.forEach((id, p) -> {
            authorNameMap.put(id, p.getNickName());
            authorLoginIdMap.put(id, p.getLoginId());
        });

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
                        authorLoginIdMap.getOrDefault(post.getUserId(), ""),
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
                author.getLoginId(),
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
