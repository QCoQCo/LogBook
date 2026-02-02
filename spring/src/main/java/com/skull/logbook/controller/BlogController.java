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
@RequestMapping("/blogs")
@RequiredArgsConstructor
public class BlogController {
    private final BlogService blogService;

    @GetMapping("/{loginId}")
    public ResponseEntity getBlog(
            @PathVariable String loginId
    ) {
        BlogLayoutDto blogLayout = blogService.getBlogData(loginId);

        return ResponseEntity.ok(blogLayout);
    }

}
