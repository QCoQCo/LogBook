package com.skull.logbook.controller;

import com.skull.logbook.constant.ReportStatus;
import com.skull.logbook.constant.Role;
import com.skull.logbook.dto.CommonCodeItemDto;
import com.skull.logbook.dto.PostResponseDto;
import com.skull.logbook.dto.ReportResponseDto;
import com.skull.logbook.dto.UserResponseDto;
import com.skull.logbook.entity.ChatRoom;
import com.skull.logbook.entity.CommonCode;
import com.skull.logbook.repository.CommonCodeRepository;
import com.skull.logbook.service.ChatRoomService;
import com.skull.logbook.service.PostService;
import com.skull.logbook.service.ReportService;
import com.skull.logbook.service.StatsService;
import com.skull.logbook.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;
    private final PostService postService;
    private final ReportService reportService;
    private final CommonCodeRepository commonCodeRepository;
    private final StatsService statsService;
    private final ChatRoomService chatRoomService;

    // ========== 유저 관리 ==========
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@RequestParam(defaultValue = "1000") int limit) {
        return ResponseEntity.ok(userService.getAllUsers(limit));
    }

    @PatchMapping(value = "/users/{userId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateUserByAdmin(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {
        if (body == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "요청 본문이 없습니다."));
        }
        try {
            String nickName = body.get("nickName");
            String userEmail = body.get("userEmail");
            String roleStr = body.get("role");
            Role role = null;
            if (roleStr != null && !roleStr.isBlank()) {
                if (!roleStr.equals("USER") && !roleStr.equals("ADMIN") && !roleStr.equals("GUEST")) {
                    return ResponseEntity.badRequest().body(Map.of("message", "role은 USER, ADMIN, GUEST 중 하나여야 합니다."));
                }
                role = Role.valueOf(roleStr);
            }
            UserResponseDto result = userService.updateUserByAdmin(userId, nickName, userEmail, role);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        String roleStr = body != null ? body.get("role") : null;
        if (roleStr == null || (!roleStr.equals("USER") && !roleStr.equals("ADMIN") && !roleStr.equals("GUEST"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "role은 USER, ADMIN, GUEST 중 하나여야 합니다."));
        }
        try {
            Role role = Role.valueOf(roleStr);
            UserResponseDto result = userService.updateUserRole(userId, role);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            userService.softDeleteUser(userId);
            return ResponseEntity.ok(Map.of("message", "회원이 삭제 처리되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ========== 게시글 관리 ==========
    @GetMapping("/posts")
    public List<PostResponseDto> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "true") boolean includeInactive,
            @RequestParam(required = false) String filter) {
        return postService.getAllPosts(page, size, includeInactive, filter);
    }

    @GetMapping("/posts/count")
    public Map<String, Long> getPostCount(
            @RequestParam(defaultValue = "true") boolean includeInactive) {
        return Map.of("totalElements", postService.countAll(includeInactive));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Map<String, String>> deletePost(@PathVariable Long postId) {
        try {
            postService.softDeletePost(postId);
            return ResponseEntity.ok(Map.of("message", "게시글이 삭제 처리되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/posts/{postId}/deactivate")
    public ResponseEntity<Map<String, String>> deactivatePost(@PathVariable Long postId) {
        try {
            postService.deactivatePost(postId);
            return ResponseEntity.ok(Map.of("message", "게시글이 비활성화되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/posts/{postId}/activate")
    public ResponseEntity<Map<String, String>> activatePost(@PathVariable Long postId) {
        try {
            postService.activatePost(postId);
            return ResponseEntity.ok(Map.of("message", "게시글이 활성화되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ========== 신고 관리 ==========
    @GetMapping("/reports")
    public ResponseEntity<List<ReportResponseDto>> getAllReports() {
        List<ReportResponseDto> list = reportService.getAllReportsForAdmin();
        return ResponseEntity.ok(list);
    }

    @PatchMapping("/reports/{reportId}")
    public ResponseEntity<?> updateReportStatus(
            @PathVariable Long reportId,
            @RequestBody Map<String, Object> body) {
        if (body == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "요청 본문이 없습니다."));
        }
        String statusStr = (String) body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "status가 필요합니다."));
        }
        try {
            ReportStatus status = ReportStatus.valueOf(statusStr.toUpperCase());
            String processType = (String) body.get("processType");
            String processNote = (String) body.get("processNote");
            Integer suspendDays = null;
            if (body.get("suspendDays") != null) {
                suspendDays = Integer.valueOf(body.get("suspendDays").toString());
            }
            ReportResponseDto updated = reportService.updateStatus(reportId, status,
                    processType, processNote, suspendDays);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ========== 공통코드 ==========
    @GetMapping("/common-codes")
    public ResponseEntity<List<CommonCodeItemDto>> getCommonCodes(
            @RequestParam(required = false) String groupCode) {
        List<CommonCode> list = groupCode != null && !groupCode.isBlank()
                ? commonCodeRepository.findByGroupCodeOrderBySortOrder(groupCode.trim())
                : commonCodeRepository.findAllWithGroupOrderByGroupCodeAndSortOrder();
        List<CommonCodeItemDto> dtos = list.stream()
                .map(c -> new CommonCodeItemDto(
                        c.getCodeGroup().getGroupCode(),
                        c.getCodeGroup().getGroupName(),
                        c.getCodeValue(),
                        c.getCodeName(),
                        c.getSortOrder(),
                        c.getUseYn()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ========== 통계 ==========
    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return statsService.getStats();
    }

    // ========== 채팅방 관리 ==========
    @GetMapping("/chat/chat-rooms")
    public ResponseEntity<Map<String, Object>> getChatRooms() {
        List<ChatRoom> entities = chatRoomService.findAllByOrderByIdAsc();
        List<Map<String, Object>> chatRooms = entities.stream()
                .map(AdminController::chatRoomToMap)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("chatRooms", chatRooms));
    }

    private static Map<String, Object> chatRoomToMap(ChatRoom r) {
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
