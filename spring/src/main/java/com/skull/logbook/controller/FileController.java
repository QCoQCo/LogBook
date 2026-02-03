package com.skull.logbook.controller;

import com.skull.logbook.service.SftpService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
