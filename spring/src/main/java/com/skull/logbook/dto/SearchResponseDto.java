package com.skull.logbook.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SearchResponseDto {
    private List<PostResponseDto> posts; // 검색된 게시글
    private List<String> recommendedTags; // AI 추천 태그 (검색어 확장)
    private String searchSource; // "DB" or "AI_HYBRID"
}
