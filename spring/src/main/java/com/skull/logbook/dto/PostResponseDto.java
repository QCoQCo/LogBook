package com.skull.logbook.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostResponseDto {
    @JsonProperty("postId")
    private Long id;
    private String userId;
    private String authorName;
    private String authorLoginId;  // 블로그 링크용 (loginId)
    private String title;
    private String content;
    private String createdAt;
    private String updatedAt;
    private List<String> tags;
    private Boolean isActive;
    private Long likeCount;
    private Boolean isLiked;
}
