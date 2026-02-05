package com.skull.logbook.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PROTECTED)
public class LinkPreviewResponseDto {
    private String title;
    private String thumbnail;

    public static LinkPreviewResponseDto of(String title, String thumbnail) {
        return new LinkPreviewResponseDto(title, thumbnail);
    }
}
