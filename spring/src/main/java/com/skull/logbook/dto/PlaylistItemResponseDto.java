package com.skull.logbook.dto;

import com.skull.logbook.entity.PlaylistItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PlaylistItemResponseDto {
    private Long id;
    private Long playId;
    private String title;
    private String link;
    private String thumbnail;
    private Integer seq;

    public PlaylistItemResponseDto(PlaylistItem item) {
        this.id = item.getId();
        this.playId = item.getPlayId();
        this.title = item.getTitle();
        this.link = item.getLink();
        this.thumbnail = item.getThumbnail();
        this.seq = item.getSeq();
    }
}
