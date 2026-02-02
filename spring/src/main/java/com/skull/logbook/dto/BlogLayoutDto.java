package com.skull.logbook.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
public class BlogLayoutDto {
    private Long blogId;

    private Long userId;

    private List<Map<String, Object>> layout;

    private List<Map<String, Object>> elements;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}
