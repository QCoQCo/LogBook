package com.skull.logbook.controller;

import com.skull.logbook.constant.Role;
import com.skull.logbook.dto.UserResponseDto;
import com.skull.logbook.entity.Blog;
import com.skull.logbook.entity.User;
import com.skull.logbook.service.BlogService;
import com.skull.logbook.service.UserFollowService;
import com.skull.logbook.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final BlogService blogService;
    private final UserFollowService userFollowService;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{loginId}")
    public ResponseEntity<?> getUser(@PathVariable String loginId) {
        UserResponseDto user = userService.getBlogOwner(loginId);

        return ResponseEntity.ok(user);
    }

    @PutMapping(value = "/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProfile(
            @PathVariable Long userId,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart(value = "introduction", required = false) String introduction,
            @RequestPart(value = "nickName", required = false) String nickName,
            @RequestPart(value = "layout", required = false) String layout
    ) {
        try {
            User updatedUser = userService.updateUserProfile(userId, file, introduction, nickName);

            Blog updatedBlog = blogService.updateBlogLayout(userId, layout);

            return ResponseEntity.ok(Map.of(
                    "message", "프로필이 수정되었습니다.",
                    "profilePhoto", updatedUser.getProfilePhoto() != null ? updatedUser.getProfilePhoto() : "",
                    "introduction", updatedUser.getIntroduction() != null ? updatedUser.getIntroduction() : "",
                    "nickName", updatedUser.getNickName()));

        } catch (IOException e) {
            e.printStackTrace(); // [디버깅] 서버 로그에 상세 에러 출력
            return ResponseEntity.internalServerError().body(Map.of("message", "파일 업로드 실패: " + e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace(); // [디버깅] 예상치 못한 에러 출력
            return ResponseEntity.internalServerError().body(Map.of("message", "서버 내부 오류: " + e.getMessage()));
        }
    }

    @PatchMapping("/me/role")
    public ResponseEntity<?> updateMyRole(@RequestBody Map<String, String> body) {
        String roleStr = body != null ? body.get("role") : null;
        if (roleStr == null || (!roleStr.equals("USER") && !roleStr.equals("ADMIN"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "role은 USER 또는 ADMIN이어야 합니다."));
        }
        try {
            Role role = Role.valueOf(roleStr);
            Map<String, Object> result = userService.updateMyRole(role);
            return ResponseEntity.ok(result);
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }
    }

    /** 관리자: 닉네임, 이메일, 역할 일괄 수정 (JSON body, 선택 필드만 보내면 됨) */
    @PatchMapping(value = "/{userId}", consumes = MediaType.APPLICATION_JSON_VALUE)
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

    @PatchMapping("/{userId}/role")
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

    @DeleteMapping("/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        try {
            userService.softDeleteUser(userId);
            return ResponseEntity.ok(Map.of("message", "회원이 삭제 처리되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** 현재 로그인 사용자가 대상 유저를 팔로우 중인지 조회 */
    @GetMapping("/{userId}/follow/status")
    public ResponseEntity<?> getFollowStatus(@PathVariable Long userId) {
        boolean following = userFollowService.isFollowing(userId);
        return ResponseEntity.ok(Map.of("following", following));
    }

    /** 대상 유저 팔로우 */
    @PostMapping("/{userId}/follow")
    public ResponseEntity<?> followUser(@PathVariable Long userId) {
        try {
            userFollowService.follow(userId);
            return ResponseEntity.ok(Map.of("message", "팔로우했습니다.", "following", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }
    }

    /** 대상 유저 언팔로우 */
    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<?> unfollowUser(@PathVariable Long userId) {
        try {
            userFollowService.unfollow(userId);
            return ResponseEntity.ok(Map.of("message", "언팔로우했습니다.", "following", false));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException e) {
            return ResponseEntity.status(403).body(Map.of("message", e.getMessage()));
        }
    }
}
