package com.skull.logbook.controller;

import com.skull.logbook.dto.UserResponseDto;
import com.skull.logbook.entity.Blog;
import com.skull.logbook.entity.User;
import com.skull.logbook.service.BlogService;
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
}
