package com.skull.logbook.controller;

import com.skull.logbook.dto.ReportCreateRequestDto;
import com.skull.logbook.dto.ReportResponseDto;
import com.skull.logbook.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /** 사용자 신고 접수 (로그인 사용자) */
    @PostMapping
    public ResponseEntity<ReportResponseDto> createReport(@RequestBody ReportCreateRequestDto dto) {
        if (dto.getReportedUserLoginId() == null || dto.getReportedUserLoginId().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        ReportResponseDto created = reportService.createReport(dto);
        return ResponseEntity.ok(created);
    }

}
