package com.skull.logbook.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.entity.Post;
import com.skull.logbook.repository.PostRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;

    public List<PostResponseDto> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc().stream()
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
