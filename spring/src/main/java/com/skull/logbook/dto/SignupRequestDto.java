package com.skull.logbook.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SignupRequestDto {
    private String loginId;
    private String password;
    private String nickName;
    private String userEmail;
    private String introduction; // 선택 사항
}
