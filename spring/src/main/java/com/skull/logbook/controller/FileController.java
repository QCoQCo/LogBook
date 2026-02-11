package com.skull.logbook.controller;

import com.skull.logbook.service.SftpService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/img")
@RequiredArgsConstructor
public class FileController {

    private final SftpService sftpService;

    @GetMapping("/{subFolder}/{userId}/{filename}")
    public ResponseEntity<Resource> getImage(
            @PathVariable String subFolder,
            @PathVariable String userId,
            @PathVariable String filename) {
        try {
            byte[] fileContent = sftpService.downloadFile(subFolder, userId, filename);
            ByteArrayResource resource = new ByteArrayResource(fileContent);

            // 파일 확장자에 따라 MediaType 결정 (간단하게 구현)
            MediaType mediaType = MediaType.IMAGE_JPEG;
            if (filename.toLowerCase().endsWith(".png")) {
                mediaType = MediaType.IMAGE_PNG;
            } else if (filename.toLowerCase().endsWith(".gif")) {
                mediaType = MediaType.IMAGE_GIF;
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .body(resource);

        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 블로그 grid layout item 이미지 업로드 전용
    @PostMapping("/blogItems/{userId}")
    public ResponseEntity<?> uploadImage(
            @PathVariable String userId,
            @RequestParam("file") MultipartFile file
    ) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("파일이 비어있습니다.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image")) {
            return ResponseEntity.badRequest().build();
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null ||
                !(originalFilename.endsWith(".jpg") ||
                        originalFilename.endsWith(".jpeg") ||
                        originalFilename.endsWith(".png") ||
                        originalFilename.endsWith(".gif"))) {
            return ResponseEntity.badRequest().body("허용되지 않는 확장자입니다.");
        }

        try {
            String uploadedPath = sftpService.uploadFile(file, "blogItems", userId);

            return ResponseEntity.ok(uploadedPath);
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("이미지 업로드 실패: " + e.getMessage());
        }
    }

}
