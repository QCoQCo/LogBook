package com.skull.logbook.controller;

import com.skull.logbook.dto.PlaylistItemRequestDto;
import com.skull.logbook.dto.PlaylistRequestDto;
import com.skull.logbook.entity.User;
import com.skull.logbook.service.PlaylistService;
import com.skull.logbook.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/playlists")
@RequiredArgsConstructor
public class PlaylistController {

    private final PlaylistService playlistService;
    private final UserService userService;

    // 1. 플레이리스트 생성 (인증 필요)
    @PostMapping
    public ResponseEntity<?> createPlaylist(@RequestBody PlaylistRequestDto requestDto, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body("Unauthorized");
        User user = userService.getUserByLoginId(principal.getName());
        return ResponseEntity.ok(playlistService.createPlaylist(user.getId(), requestDto));
    }

    // 2. 특정 유저의 플레이리스트 목록 조회 (공개 가능)
    @GetMapping
    public ResponseEntity<?> getPlaylists(@RequestParam String userId) {
        Long resolvedUserId;
        try {
            resolvedUserId = Long.parseLong(userId);
        } catch (NumberFormatException e) {
            // 숫자가 아니면 loginId로 간주하고 유저 조회
            try {
                User user = userService.getUserByLoginId(userId);
                resolvedUserId = user.getId();
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.status(404).body(Map.of("message", "User not found: " + userId));
            }
        }

        try {
            return ResponseEntity.ok(playlistService.getPlaylistsByUserId(resolvedUserId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", e.getMessage()));
        }
    }

    // 2-1. 플레이리스트 상세 조회 (단건)
    @GetMapping("/{playlistId}")
    public ResponseEntity<?> getPlaylistDetail(@PathVariable Long playlistId) {
        try {
            return ResponseEntity.ok(playlistService.getPlaylistDetail(playlistId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(Map.of("message", "Playlist not found"));
        }
    }

    // 3. 아이템 추가 (인증 필요)
    @PostMapping("/{playlistId}/items")
    public ResponseEntity<?> addPlaylistItem(@PathVariable Long playlistId,
            @RequestBody PlaylistItemRequestDto requestDto,
            Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body("Unauthorized");
        User user = userService.getUserByLoginId(principal.getName());
        return ResponseEntity.ok(playlistService.addPlaylistItem(user.getId(), playlistId, requestDto));
    }

    // 4. 플레이리스트 삭제 (인증 필요)
    @DeleteMapping("/{playlistId}")
    public ResponseEntity<?> deletePlaylist(@PathVariable Long playlistId, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body("Unauthorized");
        User user = userService.getUserByLoginId(principal.getName());
        playlistService.deletePlaylist(user.getId(), playlistId);
        return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
    }

    // 5. 아이템 삭제 (인증 필요)
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<?> deletePlaylistItem(@PathVariable Long itemId, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body("Unauthorized");
        User user = userService.getUserByLoginId(principal.getName());
        playlistService.deletePlaylistItem(user.getId(), itemId);
        return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
    }

    // 6. 플레이리스트 제목 수정
    @PatchMapping("/{playlistId}")
    public ResponseEntity<?> updatePlaylistTitle(@PathVariable Long playlistId,
            @RequestBody PlaylistRequestDto requestDto,
            Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body("Unauthorized");
        User user = userService.getUserByLoginId(principal.getName());
        return ResponseEntity.ok(playlistService.updatePlaylistTitle(user.getId(), playlistId, requestDto.getTitle()));
    }

    // 7. 플레이리스트 아이템(노래) 수정
    @PatchMapping("/items/{itemId}")
    public ResponseEntity<?> updatePlaylistItem(@PathVariable Long itemId,
            @RequestBody PlaylistItemRequestDto requestDto,
            Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body("Unauthorized");
        User user = userService.getUserByLoginId(principal.getName());
        return ResponseEntity.ok(playlistService.updatePlaylistItem(user.getId(), itemId, requestDto));
    }
}
