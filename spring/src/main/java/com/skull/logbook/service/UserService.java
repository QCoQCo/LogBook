package com.skull.logbook.service;

import org.springframework.stereotype.Service;

import com.skull.logbook.dto.SignupRequestDto;
import com.skull.logbook.dto.UserResponseDto;
import com.skull.logbook.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Long signup(SignupRequestDto requestDto) {
        if (userRepository.findByLoginId(requestDto.getLoginId()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }

        if (userRepository.findByEmail(requestDto.getUserEmail()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 이메일입니다.");
        }

        com.skull.logbook.entity.User user = com.skull.logbook.entity.User.builder()
                .loginId(requestDto.getLoginId())
                .password(requestDto.getPassword())
                .nickName(requestDto.getNickName())
                .userEmail(requestDto.getUserEmail())
                .introduction(requestDto.getIntroduction())
                .build();

        userRepository.save(user);

        return user.getId();
    }
}
