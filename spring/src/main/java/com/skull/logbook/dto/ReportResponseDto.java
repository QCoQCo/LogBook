package com.skull.logbook.dto;

import com.skull.logbook.entity.Report;
import com.skull.logbook.constant.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponseDto {
    private Long id;
    private Long reporterId;
    private String reporterLoginId;
    private Long reportedUserId;
    private String reportedUserLoginId;
    private String reportedUserNickName;
    private String reason;
    private String description;
    private ReportStatus status;
    private String processType;
    private String processNote;
    private Integer suspendDays;
    private LocalDateTime createdAt;

    public static ReportResponseDto from(Report report) {
        return new ReportResponseDto(
                report.getId(),
                report.getReporter().getId(),
                report.getReporter().getLoginId(),
                report.getReportedUser().getId(),
                report.getReportedUser().getLoginId(),
                report.getReportedUser().getNickName(),
                report.getReason(),
                report.getDescription(),
                report.getStatus() != null ? report.getStatus() : ReportStatus.PENDING,
                report.getProcessType(),
                report.getProcessNote(),
                report.getSuspendDays(),
                report.getCreatedAt()
        );
    }
}
