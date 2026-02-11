package com.skull.logbook.dto;

import com.skull.logbook.entity.Playlist;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class PlaylistResponseDto {
    private Long id;
    private Long userId;
    private String ownerLoginId; // [추가] 블로그 이동 시 필요
    private String title;
    private List<PlaylistItemResponseDto> items = new ArrayList<>();

    // 리스트 조회용 (아이템 없이)
    public PlaylistResponseDto(Playlist playlist, String ownerLoginId) {
        this.id = playlist.getId();
        this.userId = playlist.getUserId();
        this.ownerLoginId = ownerLoginId;
        this.title = playlist.getTitle();
    }

    // 상세 조회용 (아이템 포함)
    public PlaylistResponseDto(Playlist playlist, String ownerLoginId, List<PlaylistItemResponseDto> items) {
        this.id = playlist.getId();
        this.userId = playlist.getUserId();
        this.ownerLoginId = ownerLoginId;
        this.title = playlist.getTitle();
        this.items = items;
    }
}
