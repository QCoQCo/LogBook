package com.skull.logbook.controller;

import java.util.List;

import com.skull.logbook.dto.UserPostListDto;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
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
    public List<PostResponseDto> getAllPosts(@RequestParam(defaultValue = "0") int page) {
        int size = 20; // 사용자 요청에 따라 20개씩만 로드
        return postService.getAllPosts(page, size);
    }

    @GetMapping("/{postId}")
    public PostResponseDto getPostDetail(@PathVariable Long postId) {
        return postService.getPostDetail(postId);
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
