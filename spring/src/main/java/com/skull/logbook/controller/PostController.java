package com.skull.logbook.controller;

import java.util.List;
import java.util.Map;

import com.skull.logbook.dto.UserPostListDto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.service.PostService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;

    @GetMapping
    public List<PostResponseDto> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        return postService.getAllPosts(page, size, includeInactive);
    }

    @GetMapping("/count")
    public Map<String, Long> getPostCount(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        return Map.of("totalElements", postService.countAll(includeInactive));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Map<String, String>> deletePost(@PathVariable Long postId) {
        try {
            postService.softDeletePost(postId);
            return ResponseEntity.ok(Map.of("message", "게시글이 삭제 처리되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{postId}")
    public PostResponseDto getPostDetail(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        return postService.getPostDetail(postId, includeInactive);
    }

    @PatchMapping("/{postId}/deactivate")
    public ResponseEntity<Map<String, String>> deactivatePost(@PathVariable Long postId) {
        try {
            postService.deactivatePost(postId);
            return ResponseEntity.ok(Map.of("message", "게시글이 비활성화되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{postId}/activate")
    public ResponseEntity<Map<String, String>> activatePost(@PathVariable Long postId) {
        try {
            postService.activatePost(postId);
            return ResponseEntity.ok(Map.of("message", "게시글이 활성화되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/lists/{userId}")
    public List<UserPostListDto> getPostsByUserId(
            @PathVariable Long userId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        return postService.getPostsByUserId(userId, pageable);
    }
}
