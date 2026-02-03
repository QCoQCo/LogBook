package com.skull.logbook.controller;

import com.skull.logbook.entity.User;
import com.skull.logbook.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping(value = "/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProfile(
            @PathVariable Long userId,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @RequestPart(value = "introduction", required = false) String introduction,
            @RequestPart(value = "nickName", required = false) String nickName) {
        try {
            User updatedUser = userService.updateUserProfile(userId, file, introduction, nickName);
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
