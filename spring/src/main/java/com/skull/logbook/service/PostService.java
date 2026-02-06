package com.skull.logbook.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable; // Added import for Pageable
import org.springframework.stereotype.Service;

import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.entity.Post;
import com.skull.logbook.repository.PostRepository;

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
    private final PostTagRepository postTagRepository; // Injected

    public List<PostResponseDto> getAllPosts(int page, int size) {
        // 1. 게시글 목록 우선 조회
        List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));

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

        for (Post post : posts) {
            System.out.println("postId: " + post.getId());
            System.out.println("title: " + post.getTitle());
            System.out.println("content: " + post.getContent());
            System.out.println("createdAt: " + post.getCreatedAt());
            System.out.println("updatedAt: " + post.getUpdatedAt());
            System.out.println("tags: " + tagsMap.getOrDefault(post.getId(), new ArrayList<>()));
        }

        // 4. DTO 변환 (태그 주입)
        return posts.stream()
                .map(post -> new PostResponseDto(
                        post.getId(),
                        String.valueOf(post.getUserId()),
                        post.getTitle(),
                        post.getContent(),
                        post.getCreatedAt().toString(),
                        post.getUpdatedAt().toString(),
                        tagsMap.getOrDefault(post.getId(), new ArrayList<>()) // tags 필드 추가
                ))
                .toList();
    }

    public PostResponseDto getPostDetail(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found with id: " + postId));

        List<Object[]> tagData = postTagRepository.findTagsByPostIds(Collections.singletonList(postId));
        List<String> tags = tagData.stream()
                .map(data -> (String) data[1])
                .collect(Collectors.toList());

        return new PostResponseDto(
                post.getId(),
                String.valueOf(post.getUserId()),
                post.getTitle(),
                post.getContent(),
                post.getCreatedAt().toString(),
                post.getUpdatedAt().toString(),
                tags);
    }
}
