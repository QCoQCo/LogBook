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
    private List<String> relatedTopics; // 주제망 기반 연관 주제 (Hooks, Redux 등)
    private List<PostResponseDto> recommendedPosts; // 함께 보면 좋은 추천 게시글
    private String searchSource; // "DB" or "AI_HYBRID"
}
