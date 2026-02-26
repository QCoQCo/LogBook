package com.skull.logbook.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@AllArgsConstructor
public class BlogLayoutDto {
    private Long blogId;

    // loginId를 프론트에서 userId로 사용 -> PK 값 대신 String loginId 반환
    private String userId;

    private List<Map<String, Object>> layout;

    private List<Map<String, Object>> elements;

    private String colorTheme;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}
