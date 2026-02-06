package com.skull.logbook.controller;

import com.skull.logbook.dto.SearchResponseDto;
import com.skull.logbook.service.SmartSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SmartSearchController {

    private final SmartSearchService smartSearchService;

    @GetMapping("/hybrid")
    public SearchResponseDto search(@RequestParam String query) {
        return smartSearchService.search(query);
    }
}
