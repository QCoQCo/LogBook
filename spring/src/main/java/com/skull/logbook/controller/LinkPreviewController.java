package com.skull.logbook.controller;

import com.skull.logbook.dto.LinkPreviewRequestDto;
import com.skull.logbook.dto.LinkPreviewResponseDto;
import com.skull.logbook.service.LinkPreviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/links")
@RequiredArgsConstructor
public class LinkPreviewController {
    private final LinkPreviewService linkPreviewService;

    @PostMapping("/thumbnail")
    public ResponseEntity<LinkPreviewResponseDto> preview(
            @RequestBody LinkPreviewRequestDto request
    ) {
        return ResponseEntity.ok(
                linkPreviewService.parse(request.getUrl())
        );
    }

}
