package com.skull.logbook.controller;

import com.skull.logbook.dto.CreateChatRoomRequestDto;
import com.skull.logbook.entity.ChatRoom;
import com.skull.logbook.entity.User;
import com.skull.logbook.service.ChatRoomService;
import com.skull.logbook.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// 채팅방 관리 API. 메시지는 Firebase.

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRoomService chatRoomService;
    private final UserService userService;

    // 채팅방 목록 조회
    @GetMapping("/chat-rooms")
    public ResponseEntity<Map<String, Object>> getChatRooms() {
        List<ChatRoom> entities = chatRoomService.findAllByOrderByIdAsc();
        List<Map<String, Object>> chatRooms = entities.stream()
                .map(ChatController::toMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("chatRooms", chatRooms));
    }

    // 채팅방 생성
    @PostMapping("/chat-rooms")
    public ResponseEntity<Map<String, Object>> createChatRoom(
            @RequestBody CreateChatRoomRequestDto dto,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
        }
        User user = userService.getUserByLoginId(principal.getName());
        ChatRoom room = chatRoomService.createRoom(user.getLoginId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(toMap(room));
    }

    // 채팅방 삭제
    @DeleteMapping("/chat-rooms/{id}")
    public ResponseEntity<Map<String, String>> deleteChatRoom(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "로그인이 필요합니다."));
        }
        User user = userService.getUserByLoginId(principal.getName());
        chatRoomService.deleteRoom(id, user.getLoginId());
        return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
    }

    // 비공개방 비밀번호 검증
    @PostMapping("/chat-rooms/{id}/validate-password")
    public ResponseEntity<Map<String, Boolean>> validatePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String password = body != null ? body.get("password") : null;
        boolean valid = chatRoomService.validatePassword(id, password);
        return ResponseEntity.ok(Map.of("valid", valid));
    }

    // 응답 시 비밀번호 제외 (보안)
    private static Map<String, Object> toMap(ChatRoom r) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", r.getId());
        map.put("name", r.getName());
        map.put("admin", r.getAdmin());
        map.put("loginId", r.getLoginId() != null ? r.getLoginId() : "");
        map.put("isSystem", Boolean.TRUE.equals(r.getIsSystem()));
        map.put("description", r.getDescription() != null ? r.getDescription() : "");
        map.put("capacity", r.getCapacity() != null ? r.getCapacity() : 50);
        map.put("currentUsers", r.getCurrentUsers() != null ? r.getCurrentUsers() : 0);
        map.put("isPrivate", Boolean.TRUE.equals(r.getIsPrivate()));
        map.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : "2024-01-01");
        map.put("updatedAt", r.getUpdatedAt() != null ? r.getUpdatedAt().toString() : "2024-01-15");
        return map;
    }
}
