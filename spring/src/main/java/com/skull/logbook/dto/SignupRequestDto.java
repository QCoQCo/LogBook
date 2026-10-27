package com.skull.logbook.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class SignupRequestDto {
    private String loginId; // 프론트의 id
    private String password; // 프론트의 password
    private String userEmail; // 프론트의 email
    private String nickName;
    private String introduction;
    private String verificationToken; // /auth/email/verify 에서 발급받은 이메일 인증 토큰
}
