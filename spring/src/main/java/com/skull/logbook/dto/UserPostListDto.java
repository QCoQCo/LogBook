package com.skull.logbook.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class UserPostListDto {
    private final Long postId;
    private final String title;
    private final String content;
    private final LocalDateTime createdAt;
}
