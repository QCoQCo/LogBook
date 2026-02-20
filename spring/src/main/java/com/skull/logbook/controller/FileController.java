package com.skull.logbook.controller;

import com.skull.logbook.dto.ImageConfirmRequestDto;
import com.skull.logbook.service.SftpService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/img")
@RequiredArgsConstructor
public class FileController {

    private final SftpService sftpService;

    @GetMapping("/{subFolder}/{userId}/**")
    public ResponseEntity<Resource> getImage(
            @PathVariable String subFolder,
            @PathVariable String userId,
            HttpServletRequest request
    ) {
        try {
            String fullPath = request.getRequestURI();

            // "/img/" 이후 경로만 추출
            String basePath = "/img/" + subFolder + "/" + userId + "/";
            String filename = fullPath.substring(fullPath.indexOf(basePath) + basePath.length());

            byte[] fileContent = sftpService.downloadFileWithPath(
                    subFolder,
                    userId,
                    filename
            );

            ByteArrayResource resource = new ByteArrayResource(fileContent);

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
            @RequestParam("file") MultipartFile file,
            @RequestParam("editId") String editId
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
            String uploadedPath = sftpService.uploadFile(file, "blogItems", userId, "temp", editId);

            return ResponseEntity.ok(uploadedPath);
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("이미지 업로드 실패: " + e.getMessage());
        }
    }

    // 블로그 grid layout item 이미지 temp 이동 처리
    @PatchMapping("/blogItems/{userId}")
    public ResponseEntity<?> confirmImages(
            @PathVariable String userId,
            @RequestBody ImageConfirmRequestDto request
    ) {
        try {
            sftpService.moveTempSessionFiles(
                    "blogItems",
                    userId,
                    request.getEditId(),
                    request.getFiles()
            );
            System.out.println("에디트: " + request.getEditId());

            return ResponseEntity.ok("이미지 파일 이동 완료");
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("이미지 파일 이동 실패: " + e.getMessage());
        }
    }
}
