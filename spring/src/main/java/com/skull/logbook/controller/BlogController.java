package com.skull.logbook.controller;

import com.skull.logbook.dto.BlogLayoutDto;
import com.skull.logbook.service.BlogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/blog")
@RequiredArgsConstructor
public class BlogController {
    private final BlogService blogService;

    @GetMapping("/{userId}")
    public ResponseEntity getBlog(
            @PathVariable Long userId
    ) {
        BlogLayoutDto blogLayout = blogService.getBlogData(userId);

        return ResponseEntity.ok(blogLayout);
    }

}
