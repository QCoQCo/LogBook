package com.skull.logbook.controller;

import java.util.List;
import java.util.Map;

import com.skull.logbook.dto.PostDeleteRequestDto;
import com.skull.logbook.dto.PostRequestDto;
import com.skull.logbook.dto.UserPostListDto;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.service.PostLikeService;
import com.skull.logbook.service.PostService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;
    private final PostLikeService postLikeService;

    private boolean isCurrentUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        for (GrantedAuthority authority : authentication.getAuthorities()) {
            if ("ROLE_ADMIN".equals(authority.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    @PostMapping
    public ResponseEntity<Long> createPost(
            @Valid @RequestBody PostRequestDto dto
    ) {
        Long postId = postService.createPost(dto);
        return ResponseEntity.ok(postId);
    }

    @DeleteMapping
    @PreAuthorize("@postSecurity.isOwner(#requestDto.postId, principal.id)")
    public ResponseEntity<Void> deletePost(
            @RequestBody PostDeleteRequestDto requestDto
    ) {
        postService.softDeletePost(requestDto.getPostId());
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public List<PostResponseDto> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean includeInactive,
            @RequestParam(required = false) String filter) {
        boolean isAdmin = isCurrentUserAdmin();
        boolean effectiveIncludeInactive = includeInactive && isAdmin;
        return postService.getAllPosts(page, size, effectiveIncludeInactive, filter);
    }

    @GetMapping("/count")
    public Map<String, Long> getPostCount(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        boolean isAdmin = isCurrentUserAdmin();
        boolean effectiveIncludeInactive = includeInactive && isAdmin;
        return Map.of("totalElements", postService.countAll(effectiveIncludeInactive));
    }

    @GetMapping("/{postId}")
    public PostResponseDto getPostDetail(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        boolean isAdmin = isCurrentUserAdmin();
        boolean effectiveIncludeInactive = includeInactive && isAdmin;
        return postService.getPostDetail(postId, effectiveIncludeInactive);
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<Map<String, Object>> likePost(@PathVariable Long postId) {
        try {
            postLikeService.like(postId);
            long likeCount = postLikeService.countLikes(postId);
            return ResponseEntity.ok(Map.of(
                    "message", "좋아요를 눌렀습니다.",
                    "likeCount", likeCount,
                    "isLiked", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{postId}/like")
    public ResponseEntity<Map<String, Object>> unlikePost(@PathVariable Long postId) {
        try {
            postLikeService.unlike(postId);
            long likeCount = postLikeService.countLikes(postId);
            return ResponseEntity.ok(Map.of(
                    "message", "좋아요를 취소했습니다.",
                    "likeCount", likeCount,
                    "isLiked", false));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/lists/{userId}")
    public ResponseEntity<Page<UserPostListDto>> getPostsByUserId(
            @PathVariable Long userId,
            @PageableDefault(
                    size = 20,
                    sort = {"createdAt", "id"}, // createdAt이 같으면 id 역순으로 정렬
                    direction = Sort.Direction.DESC
            ) Pageable pageable
    ) {
        Page<UserPostListDto> posts = postService.getPostsByUserId(userId, pageable);
        return ResponseEntity.ok(posts);
    }
}
