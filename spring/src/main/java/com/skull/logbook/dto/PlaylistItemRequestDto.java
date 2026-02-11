package com.skull.logbook.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PlaylistItemRequestDto {
    private String title;
    private String link;
    private String thumbnail;
    private Integer seq;
}
