package com.skull.logbook.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReportCreateRequestDto {
    private String reportedUserLoginId;  // 신고 대상 사용자 로그인ID
    private String reason;         // 신고 사유 코드 (spam, harassment, ...)
    private String description;    // 상세 설명 (선택)
}
