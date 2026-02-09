package com.skull.logbook.dto;

import com.skull.logbook.entity.User;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserResponseDto {
    private Long id;

    @NotBlank(message = "로그인 아이디는 필수 입력값입니다.")
    private String loginId;

    @NotBlank(message = "닉네임은 필수 입력값입니다.")
    private String nickName;

    @Email(message = "유효하지 않은 이메일 형식입니다.")
    @NotBlank(message = "이메일은 필수 입력값입니다.")
    private String userEmail;
    private String profilePhoto;
    private String introduction;
    private String role;

    public static UserResponseDto from(User user) {
        return new UserResponseDto(
                user.getId(),
                user.getLoginId(),
                user.getNickName(),
                user.getUserEmail(),
                user.getProfilePhoto(),
                user.getIntroduction(),
                user.getRole() != null ? user.getRole().name() : null);
    }
}
