package com.skull.logbook.dto;

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
    private String title;
    private String content;
    private String createdAt;
    private String updatedAt;
}
