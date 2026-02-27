package com.skull.logbook.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.skull.logbook.dto.PlaylistImportResultDto;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
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

    @Value("${youtube.api-key:}")
    private String youtubeApiKey;

    @Value("${YT_DLP_PATH:/Users/apple/Library/Python/3.9/bin/yt-dlp}")
    private String ytDlpPath;

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

        // 중복 링크 체크: 같은 link가 이미 있으면 기존 항목 반환 (중복 저장 방지)
        String incomingLink = requestDto.getLink();
        if (incomingLink != null && !incomingLink.isBlank()) {
            List<PlaylistItem> existing = playlistItemRepository.findByPlayIdOrderBySeqAsc(playlistId);
            for (PlaylistItem ex : existing) {
                if (incomingLink.equalsIgnoreCase(ex.getLink())) {
                    return new PlaylistItemResponseDto(ex); // 조용히 기존 항목 반환
                }
            }
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

    // 10. YouTube 재생목록 URL에서 곡 목록 가져오기
    @Transactional(readOnly = true)
    public List<PlaylistImportResultDto> importYoutubePlaylist(String playlistUrl) {
        try {
            java.net.URL parsedUrl = java.net.URI.create(playlistUrl).toURL();
            String listParam = null;
            String query = parsedUrl.getQuery();
            if (query != null) {
                for (String param : query.split("&")) {
                    if (param.startsWith("list=")) {
                        listParam = param.substring(5);
                        break;
                    }
                }
            }

            if (listParam == null) {
                throw new IllegalArgumentException("재생목록 URL이 아닙니다. (list= 파라미터 없음)");
            }

            // PL로 시작하면 YouTube Data API 사용
            if (listParam.startsWith("PL") && youtubeApiKey != null && !youtubeApiKey.isBlank()) {
                return importViYoutubeApi(listParam);
            }

            // PL인데 API 키가 없으면 yt-dlp로 폴백 (무제한)
            if (listParam.startsWith("PL")) {
                return importViaYtDlp(playlistUrl, false);
            }

            // RD 등 나머지는 yt-dlp 사용 (최대 25개)
            return importViaYtDlp(playlistUrl, true);

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("재생목록 가져오기 실패: " + e.getMessage(), e);
        }
    }

    // YouTube Data API v3로 PL 재생목록 가져오기
    private List<PlaylistImportResultDto> importViYoutubeApi(String listId) throws Exception {
        List<PlaylistImportResultDto> results = new ArrayList<>();
        RestTemplate restTemplate = new RestTemplate();
        String pageToken = null;

        do {
            String url = "https://www.googleapis.com/youtube/v3/playlistItems"
                    + "?part=snippet&maxResults=50&playlistId="
                    + URLEncoder.encode(listId, StandardCharsets.UTF_8)
                    + "&key=" + youtubeApiKey
                    + (pageToken != null ? "&pageToken=" + pageToken : "");

            String response = restTemplate.getForObject(url, String.class);
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            JsonNode items = root.path("items");

            for (JsonNode item : items) {
                JsonNode snippet = item.path("snippet");
                String videoId = snippet.path("resourceId").path("videoId").asText(null);
                if (videoId == null || videoId.isBlank()) continue;

                String title = snippet.path("title").asText("");
                String thumbnail = snippet.path("thumbnails").path("medium").path("url").asText("");
                if (thumbnail.isBlank()) {
                    thumbnail = snippet.path("thumbnails").path("default").path("url").asText("");
                }
                // 어떤 경우에도 YouTube 표준 썸네일 URL로 보장
                if (thumbnail.isBlank()) {
                    thumbnail = "https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg";
                }
                results.add(new PlaylistImportResultDto(
                        title,
                        "https://www.youtube.com/watch?v=" + videoId,
                        thumbnail
                ));
            }

            JsonNode nextToken = root.path("nextPageToken");
            pageToken = nextToken.isMissingNode() ? null : nextToken.asText(null);

        } while (pageToken != null);

        return results;
    }

    // yt-dlp 프로세스 실행으로 재생목록 가져오기
    // limitTo25=true: RD 재생목록은 최대 25개, false: 무제한(PL 폴백)
    private List<PlaylistImportResultDto> importViaYtDlp(String playlistUrl, boolean limitTo25) throws Exception {
        List<PlaylistImportResultDto> results = new ArrayList<>();
        final int MAX_ITEMS = limitTo25 ? 25 : Integer.MAX_VALUE;

        ProcessBuilder pb = new ProcessBuilder(
                ytDlpPath, // .env YT_DLP_PATH 또는 PATH의 yt-dlp
                "--flat-playlist",
                "--dump-json",
                "--no-warnings",
                "--playlist-end", limitTo25 ? "25" : "999", // yt-dlp 자체에서 상한 적용
                playlistUrl
        );
        pb.redirectErrorStream(false); // stderr 분리
        Process process = pb.start();

        // stderr를 별도 스레드에서 소비 (버퍼 막힘 방지)
        Thread stderrDrainer = new Thread(() -> {
            try (java.io.InputStream es = process.getErrorStream()) {
                es.transferTo(java.io.OutputStream.nullOutputStream());
            } catch (Exception ignored) {}
        });
        stderrDrainer.setDaemon(true);
        stderrDrainer.start();

        ObjectMapper mapper = new ObjectMapper();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (results.size() >= MAX_ITEMS) break;
                if (line.isBlank()) continue;
                try {
                    JsonNode node = mapper.readTree(line);
                    String id = node.path("id").asText(null);
                    if (id == null || id.isBlank()) continue;

                    String title = node.path("title").asText("");
                    String thumbnail = node.path("thumbnail").asText("");
                    // yt-dlp flat 모드에서 썸네일이 없을 경우 video ID로 직접 생성
                    if (thumbnail.isBlank()) {
                        thumbnail = "https://img.youtube.com/vi/" + id + "/mqdefault.jpg";
                    }
                    results.add(new PlaylistImportResultDto(
                            title,
                            "https://www.youtube.com/watch?v=" + id,
                            thumbnail
                    ));
                } catch (Exception ignored) {}
            }
        } finally {
            // 읽기 완료 또는 25개 도달 시 프로세스 강제 종료
            process.destroyForcibly();
            boolean finished = process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS);
            if (!finished) process.destroyForcibly();
        }
        return results;
    }
}

