package com.skull.logbook.entity;

import com.skull.logbook.constant.ReportStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@Table(name = "report")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Report extends BaseCreatedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id", nullable = false)
    private User reportedUser;

    @Column(nullable = false, length = 50)
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) not null default 'PENDING'")
    private ReportStatus status;

    @Column(length = 20)
    private String processType;

    @Column(columnDefinition = "TEXT")
    private String processNote;

    @Column
    private Integer suspendDays;

    @Builder
    public Report(User reporter, User reportedUser, String reason, String description) {
        this.reporter = reporter;
        this.reportedUser = reportedUser;
        this.reason = reason;
        this.description = description;
        this.status = ReportStatus.PENDING;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }

    public void setProcessInfo(String processType, String processNote, Integer suspendDays) {
        this.processType = processType;
        this.processNote = processNote;
        this.suspendDays = suspendDays;
    }
}
