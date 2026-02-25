package com.skull.logbook.service;

import com.skull.logbook.constant.NotificationType;
import com.skull.logbook.constant.ReportStatus;
import com.skull.logbook.constant.Role;
import com.skull.logbook.dto.ReportCreateRequestDto;
import com.skull.logbook.dto.ReportResponseDto;
import com.skull.logbook.entity.Report;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;
    private final UserService userService;
    private final NotificationService notificationService;

    /** 로그인 사용자가 다른 사용자를 신고 */
    @Transactional
    public ReportResponseDto createReport(ReportCreateRequestDto dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        User reporter = userService.getUserByLoginId(auth.getName());
        if (dto.getReportedUserLoginId() == null || dto.getReportedUserLoginId().isBlank()) {
            throw new IllegalArgumentException("신고 대상 사용자 정보가 없습니다.");
        }
        User reportedUser = userService.getUserByLoginId(dto.getReportedUserLoginId().trim());

        if (reporter.getId().equals(reportedUser.getId())) {
            throw new IllegalArgumentException("자기 자신은 신고할 수 없습니다.");
        }
        if (reportedUser.isDeleted()) {
            throw new IllegalArgumentException("삭제된 사용자는 신고할 수 없습니다.");
        }

        Report report = Report.builder()
                .reporter(reporter)
                .reportedUser(reportedUser)
                .reason(dto.getReason() != null ? dto.getReason().trim() : "other")
                .description(dto.getDescription() != null ? dto.getDescription().trim() : null)
                .build();
        report = reportRepository.save(report);
        return ReportResponseDto.from(report);
    }

    /** 관리자 전용: 신고 목록 조회 (최신순) */
    @Transactional(readOnly = true)
    public List<ReportResponseDto> getAllReportsForAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("로그인이 필요합니다.");
        }
        User admin = userService.getUserByLoginId(auth.getName());
        if (admin.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("관리자만 신고 목록을 조회할 수 있습니다.");
        }

        return reportRepository.findAllWithUsersOrderByCreatedAtDesc().stream()
                .map(ReportResponseDto::from)
                .collect(Collectors.toList());
    }

    /** 관리자 전용: 신고 상태 변경 (처리/반려) */
    @Transactional
    public ReportResponseDto updateStatus(Long reportId, ReportStatus status, String processType, 
                                          String processNote, Integer suspendDays) {
        User admin = userService.getUserByLoginId(
                SecurityContextHolder.getContext().getAuthentication().getName());
        if (admin.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("관리자만 신고를 처리할 수 있습니다.");
        }
        if (status != ReportStatus.PROCESSED && status != ReportStatus.REJECTED) {
            throw new IllegalArgumentException("상태는 PROCESSED 또는 REJECTED만 설정할 수 있습니다.");
        }
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 신고입니다."));
        report.setStatus(status);

        // 처리 정보 저장
        if (status == ReportStatus.PROCESSED) {
            report.setProcessInfo(processType, processNote, suspendDays);
            // 알림: 신고자에게 "회원님이 신고하신 내용이 처리되었습니다."
            notificationService.createAndPush(
                    NotificationType.REPORT_PROCESSED,
                    report.getReporter().getId(),
                    "신고 처리 완료",
                    "회원님이 신고하신 내용이 처리되었습니다.",
                    report.getId()
            );
        }

        return ReportResponseDto.from(report);
    }
}
