package com.skull.logbook.controller;

import com.skull.logbook.constant.ReportStatus;
import com.skull.logbook.dto.ReportCreateRequestDto;
import com.skull.logbook.dto.ReportResponseDto;
import com.skull.logbook.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    /** 관리자 전용: 신고 목록 조회 */
    @GetMapping
    public ResponseEntity<List<ReportResponseDto>> getAllReports() {
        List<ReportResponseDto> list = reportService.getAllReportsForAdmin();
        return ResponseEntity.ok(list);
    }

    /** 관리자 전용: 신고 상태 변경 (처리/반려) */
    @PatchMapping("/{reportId}")
    public ResponseEntity<?> updateReportStatus(
            @PathVariable Long reportId,
            @RequestBody Map<String, Object> body) {
        if (body == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "요청 본문이 없습니다."));
        }
        String statusStr = (String) body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "status가 필요합니다."));
        }
        try {
            ReportStatus status = ReportStatus.valueOf(statusStr.toUpperCase());
            String processType = (String) body.get("processType");
            String processNote = (String) body.get("processNote");
            Integer suspendDays = null;
            if (body.get("suspendDays") != null) {
                suspendDays = Integer.valueOf(body.get("suspendDays").toString());
            }
            ReportResponseDto updated = reportService.updateStatus(reportId, status, 
                    processType, processNote, suspendDays);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
