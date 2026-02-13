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
    public SearchResponseDto search(
            @RequestParam String query,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "false") Boolean tagOnly,
            @RequestParam(required = false, defaultValue = "false") Boolean includeInactive) {
        return smartSearchService.search(query, page, size, tagOnly, includeInactive);
    }
}
