package com.skull.logbook.service;

import com.skull.logbook.dto.CreateChatRoomRequestDto;
import com.skull.logbook.entity.ChatRoom;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    public List<ChatRoom> findAllByOrderByIdAsc() {
        return chatRoomRepository.findAllByOrderByIdAsc();
    }

    @Transactional
    public ChatRoom createRoom(String creatorLoginId, CreateChatRoomRequestDto dto) {
        User creator = userService.getUserByLoginId(creatorLoginId);
        String name = dto.getName() != null ? dto.getName().trim() : "";
        if (name.isEmpty()) {
            throw new IllegalArgumentException("채팅방 이름을 입력해주세요.");
        }
        int capacity = dto.getCapacity() != null && dto.getCapacity() > 0 ? dto.getCapacity() : 50;
        boolean isPrivate = Boolean.TRUE.equals(dto.getIsPrivate());
        String encodedPassword = null;
        if (isPrivate && dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            encodedPassword = passwordEncoder.encode(dto.getPassword());
        }

        ChatRoom room = ChatRoom.builder()
                .name(name)
                .admin(creator.getNickName())
                .loginId(creator.getLoginId())
                .isSystem(false)
                .description(dto.getDescription() != null ? dto.getDescription() : "")
                .capacity(capacity)
                .currentUsers(0)
                .isPrivate(isPrivate)
                .password(encodedPassword)
                .build();
        return chatRoomRepository.save(room);
    }

    @Transactional
    public void deleteRoom(Long roomId, String requesterLoginId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        if (Boolean.TRUE.equals(room.getIsSystem())) {
            throw new IllegalArgumentException("기본 채팅방은 삭제할 수 없습니다.");
        }
        if (!room.getLoginId().equals(requesterLoginId)) {
            throw new IllegalArgumentException("본인이 생성한 채팅방만 삭제할 수 있습니다.");
        }
        chatRoomRepository.delete(room);
    }

    /**
     * 비공개방 비밀번호 검증. 비밀번호는 DB에 해시 또는 평문(시드) 저장 가능.
     */
    public boolean validatePassword(Long roomId, String inputPassword) {
        if (inputPassword == null) {
            inputPassword = "";
        }
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        if (!room.getIsPrivate()) {
            return true;
        }
        String stored = room.getPassword();
        if (stored == null) {
            return false;
        }
        if (stored.startsWith("$2")) {
            return passwordEncoder.matches(inputPassword, stored);
        }
        return stored.equals(inputPassword);
    }
}
