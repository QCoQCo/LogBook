package com.skull.logbook.service;

import org.springframework.stereotype.Service;

import com.skull.logbook.dto.UserResponseDto;
import com.skull.logbook.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Long addUser(UserResponseDto userResponseDto) {

    }
}
