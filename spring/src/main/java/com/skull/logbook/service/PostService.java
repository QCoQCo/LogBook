package com.skull.logbook.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable; // Added import for Pageable
import org.springframework.stereotype.Service;

import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.entity.Post;
import com.skull.logbook.repository.PostRepository;

import lombok.RequiredArgsConstructor;

import java.util.List; // Added import for List

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;

    public List<PostResponseDto> getAllPosts(int page, int size) {
        return postRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size)).stream()
                .map(post -> new PostResponseDto(
                        post.getId(),
                        String.valueOf(post.getUserId()),
                        post.getTitle(),
                        post.getContent(),
                        post.getCreatedAt().toString(),
                        post.getUpdatedAt().toString()))
                .toList();
    }
}
