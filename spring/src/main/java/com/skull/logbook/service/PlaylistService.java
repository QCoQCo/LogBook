package com.skull.logbook.service;

import com.skull.logbook.dto.PlaylistItemRequestDto;
import com.skull.logbook.dto.PlaylistItemResponseDto;
import com.skull.logbook.dto.PlaylistRequestDto;
import com.skull.logbook.dto.PlaylistResponseDto;
import com.skull.logbook.entity.Playlist;
import com.skull.logbook.entity.PlaylistItem;
import com.skull.logbook.repository.PlaylistItemRepository;
import com.skull.logbook.repository.PlaylistRepository;
import com.skull.logbook.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistItemRepository playlistItemRepository;
    private final UserRepository userRepository;

    // 1. 플레이리스트 생성
    public PlaylistResponseDto createPlaylist(Long userId, PlaylistRequestDto requestDto) {
        Playlist playlist = new Playlist();
        playlist.setUserId(userId);
        playlist.setTitle(requestDto.getTitle());

        Playlist savedPlaylist = playlistRepository.save(playlist);
        String ownerLoginId = userRepository.findById(userId)
                .map(u -> u.getLoginId()).orElse("unknown");
        return new PlaylistResponseDto(savedPlaylist, ownerLoginId);
    }

    // 2. 내 플레이리스트 목록 조회
    @Transactional(readOnly = true)
    public List<PlaylistResponseDto> getPlaylistsByUserId(Long userId) {
        List<Playlist> playlists = playlistRepository.findByUserId(userId);
        String ownerLoginId = userRepository.findById(userId)
                .map(u -> u.getLoginId()).orElse("unknown");

        return playlists.stream().map(playlist -> {
            List<PlaylistItem> items = playlistItemRepository.findByPlayIdOrderBySeqAsc(playlist.getId());
            List<PlaylistItemResponseDto> itemDtos = items.stream()
                    .map(PlaylistItemResponseDto::new)
                    .collect(Collectors.toList());
            return new PlaylistResponseDto(playlist, ownerLoginId, itemDtos);
        }).collect(Collectors.toList());
    }

    // 3. 플레이리스트 상세 조회 (단건)
    @Transactional(readOnly = true)
    public PlaylistResponseDto getPlaylistDetail(Long playlistId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

        String ownerLoginId = userRepository.findById(playlist.getUserId())
                .map(u -> u.getLoginId()).orElse("unknown");

        List<PlaylistItem> items = playlistItemRepository.findByPlayIdOrderBySeqAsc(playlistId);
        List<PlaylistItemResponseDto> itemDtos = items.stream()
                .map(PlaylistItemResponseDto::new)
                .collect(Collectors.toList());

        return new PlaylistResponseDto(playlist, ownerLoginId, itemDtos);
    }

    // 4. 아이템 추가
    public PlaylistItemResponseDto addPlaylistItem(Long userId, Long playlistId, PlaylistItemRequestDto requestDto) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

        // 소유권 확인
        if (!playlist.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인의 플레이리스트에만 추가할 수 있습니다.");
        }

        PlaylistItem item = new PlaylistItem();
        item.setPlayId(playlistId);
        item.setTitle(requestDto.getTitle());
        item.setLink(requestDto.getLink());
        item.setThumbnail(requestDto.getThumbnail());
        // 순서(seq)는 요청이 있으면 넣고, 없으면 맨 뒤에 추가하는 로직 가능 (여기선 단순 저장)
        item.setSeq(requestDto.getSeq() != null ? requestDto.getSeq() : 0);

        PlaylistItem savedItem = playlistItemRepository.save(item);
        return new PlaylistItemResponseDto(savedItem);
    }

    // 5. 플레이리스트 삭제
    public void deletePlaylist(Long userId, Long playlistId) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

        // 소유권 확인
        if (!playlist.getUserId().equals(userId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }

        // 1) 아이템 먼저 삭제 (Cascade 설정이 없다면 수동 삭제 필요)
        playlistItemRepository.deleteByPlayId(playlistId);
        // 2) 플레이리스트 삭제
        playlistRepository.delete(playlist);
    }

    // 6. 아이템 삭제
    public void deletePlaylistItem(Long userId, Long itemId) {
        PlaylistItem item = playlistItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("아이템을 찾을 수 없습니다."));

        Playlist playlist = playlistRepository.findById(item.getPlayId())
                .orElseThrow(() -> new IllegalArgumentException("플레이리스트 정보를 찾을 수 없습니다."));

        // 소유권 확인
        if (!playlist.getUserId().equals(userId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다.");
        }

        playlistItemRepository.delete(item);
    }

    // 7. 플레이리스트 제목 수정
    public PlaylistResponseDto updatePlaylistTitle(Long userId, Long playlistId, String newTitle) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

        if (!playlist.getUserId().equals(userId)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        playlist.setTitle(newTitle);
        Playlist updated = playlistRepository.save(playlist);
        String ownerLoginId = userRepository.findById(userId)
                .map(u -> u.getLoginId()).orElse("unknown");
        return new PlaylistResponseDto(updated, ownerLoginId);
    }

    // 8. 플레이리스트 아이템(노래) 수정
    public PlaylistItemResponseDto updatePlaylistItem(Long userId, Long itemId, PlaylistItemRequestDto requestDto) {
        PlaylistItem item = playlistItemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("아이템을 찾을 수 없습니다."));

        Playlist playlist = playlistRepository.findById(item.getPlayId())
                .orElseThrow(() -> new IllegalArgumentException("플레이리스트 정보를 찾을 수 없습니다."));

        if (!playlist.getUserId().equals(userId)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        if (requestDto.getTitle() != null)
            item.setTitle(requestDto.getTitle());
        if (requestDto.getLink() != null)
            item.setLink(requestDto.getLink());
        if (requestDto.getThumbnail() != null)
            item.setThumbnail(requestDto.getThumbnail());
        if (requestDto.getSeq() != null)
            item.setSeq(requestDto.getSeq());

        PlaylistItem updatedItem = playlistItemRepository.save(item);
        return new PlaylistItemResponseDto(updatedItem);
    }

    // 9. 플레이리스트 아이템 일괄 수정
    public void updatePlaylistItemsBatch(Long userId, Long playlistId, List<PlaylistItemRequestDto> requestDtos) {
        Playlist playlist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new IllegalArgumentException("플레이리스트를 찾을 수 없습니다."));

        if (!playlist.getUserId().equals(userId)) {
            throw new IllegalArgumentException("수정 권한이 없습니다.");
        }

        // 현재 플레이리스트에 속한 모든 아이템 조회
        List<PlaylistItem> currentItems = playlistItemRepository.findByPlayIdOrderBySeqAsc(playlistId);
        Map<Long, PlaylistItem> itemMap = currentItems.stream()
                .collect(Collectors.toMap(PlaylistItem::getId, item -> item));

        // 정합성 보장 Sequencer: 요청된 데이터의 순서를 0부터 순차적으로 강제 재배열
        for (int i = 0; i < requestDtos.size(); i++) {
            PlaylistItemRequestDto dto = requestDtos.get(i);
            if (dto.getId() == null) continue;

            PlaylistItem item = itemMap.get(dto.getId());
            if (item != null) {
                item.setSeq(i); // 순차적 인덱스 강제 부여로 꼬임 방지
                if (dto.getTitle() != null) item.setTitle(dto.getTitle());
                if (dto.getLink() != null) item.setLink(dto.getLink());
                if (dto.getThumbnail() != null) item.setThumbnail(dto.getThumbnail());
            }
        }
        // Dirty Checking에 의해 트랜잭션 종료 시 일괄 저장됨
    }
}
