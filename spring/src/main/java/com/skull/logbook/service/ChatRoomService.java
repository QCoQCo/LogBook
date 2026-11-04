package com.skull.logbook.service;

import com.skull.logbook.dto.CreateChatRoomRequestDto;
import com.skull.logbook.entity.ChatRoom;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRoomService {

    // 비로그인 사용자가 읽을 수 있는 방 (프론트 ChatRoomList의 비로그인 목록과 동일)
    private static final String GUEST_ROOM_NAME = "일반 채팅방";

    // 비공개방 비밀번호가 4자리이므로 대입 공격 방지
    private static final int MAX_PASSWORD_ATTEMPTS = 5;
    private static final long PASSWORD_LOCK_MILLIS = 5 * 60 * 1000L;

    private final ChatRoomRepository chatRoomRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final FirebaseService firebaseService;

    private final Map<String, PasswordAttempts> passwordAttempts = new ConcurrentHashMap<>();

    public List<ChatRoom> findAllByOrderByIdAsc() {
        return chatRoomRepository.findAllByOrderByIdAsc();
    }

    /** 기존 채팅방을 Firestore 접근 정보에 반영. 실패해도 규칙이 차단 쪽으로 동작하므로 서버는 계속 기동한다. */
    @EventListener(ApplicationReadyEvent.class)
    public void syncRoomAccess() {
        if (!firebaseService.isEnabled()) {
            return;
        }
        try {
            Map<String, FirebaseService.RoomAccess> rooms = new LinkedHashMap<>();
            for (ChatRoom room : chatRoomRepository.findAllByOrderByIdAsc()) {
                FirebaseService.RoomAccess access = toRoomAccess(room);
                // 예전에 만들어진 이름 충돌 방은 비공개 쪽을 우선해 메시지가 노출되지 않게 함
                rooms.merge(access.collectionName(), access, (a, b) -> new FirebaseService.RoomAccess(
                        a.collectionName(), a.name(), a.isPrivate() || b.isPrivate(), false));
            }
            firebaseService.saveRoomAccess(List.copyOf(rooms.values()));
            log.info("채팅방 접근 정보 동기화 완료: {}개", rooms.size());
        } catch (RuntimeException e) {
            log.error("채팅방 접근 정보 동기화 실패", e);
        }
    }

    @Transactional
    public ChatRoom createRoom(String creatorLoginId, CreateChatRoomRequestDto dto) {
        User creator = userService.getUserByLoginId(creatorLoginId);
        String name = dto.getName() != null ? dto.getName().trim() : "";
        if (name.isEmpty()) {
            throw new IllegalArgumentException("채팅방 이름을 입력해주세요.");
        }
        requireUsableRoomName(name);
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
        ChatRoom saved = chatRoomRepository.save(room);

        // Firestore 저장이 실패하면 예외로 방 생성도 롤백되어, 메시지를 쓸 수 없는 방이 남지 않음
        if (firebaseService.isEnabled()) {
            firebaseService.saveRoomAccess(List.of(toRoomAccess(saved)));
            if (isPrivate) {
                firebaseService.addRoomMember(FirebaseService.collectionName(name), creator.getId());
            }
        }
        return saved;
    }

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

        if (firebaseService.isEnabled()) {
            try {
                firebaseService.deleteRoomData(room.getName(), FirebaseService.collectionName(room.getName()));
            } catch (RuntimeException e) {
                // 방은 이미 삭제됨. 접근 정보가 남으면 규칙이 계속 허용하므로 로그로 남겨 수동 정리
                log.error("채팅방 Firestore 데이터 정리 실패: {}", room.getName(), e);
            }
        }
    }

    /**
     * 비공개방 비밀번호 검증. 비밀번호는 DB에 해시 또는 평문(시드) 저장 가능.
     * 성공하면 Firestore에 입장 권한을 기록한다.
     */
    public boolean validatePassword(Long roomId, String inputPassword, Long userId) {
        if (inputPassword == null) {
            inputPassword = "";
        }
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        if (!room.getIsPrivate()) {
            return true;
        }

        String attemptKey = userId + ":" + roomId;
        PasswordAttempts attempts = passwordAttempts.get(attemptKey);
        if (attempts != null && attempts.isLocked()) {
            throw new IllegalArgumentException("비밀번호 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.");
        }

        if (!matchesPassword(room.getPassword(), inputPassword)) {
            passwordAttempts.merge(attemptKey, PasswordAttempts.first(), (old, ignored) -> old.next());
            return false;
        }

        passwordAttempts.remove(attemptKey);
        if (firebaseService.isEnabled()) {
            firebaseService.addRoomMember(FirebaseService.collectionName(room.getName()), userId);
        }
        return true;
    }

    private boolean matchesPassword(String stored, String inputPassword) {
        if (stored == null) {
            return false;
        }
        if (stored.startsWith("$2")) {
            return passwordEncoder.matches(inputPassword, stored);
        }
        return stored.equals(inputPassword);
    }

    // 특수문자를 제거한 컬렉션 이름이 겹치면 다른 방의 메시지를 읽게 되므로 생성을 막음
    private void requireUsableRoomName(String name) {
        String collectionName = FirebaseService.collectionName(name);
        if (collectionName.equals(FirebaseService.collectionName(""))) {
            throw new IllegalArgumentException("채팅방 이름에는 한글, 영문 또는 숫자가 포함되어야 합니다.");
        }
        for (ChatRoom existing : chatRoomRepository.findAllByOrderByIdAsc()) {
            if (FirebaseService.collectionName(existing.getName()).equals(collectionName)) {
                throw new IllegalArgumentException("이미 비슷한 이름의 채팅방이 있습니다.");
            }
        }
    }

    private FirebaseService.RoomAccess toRoomAccess(ChatRoom room) {
        boolean isPrivate = Boolean.TRUE.equals(room.getIsPrivate());
        return new FirebaseService.RoomAccess(
                FirebaseService.collectionName(room.getName()),
                room.getName(),
                isPrivate,
                !isPrivate && GUEST_ROOM_NAME.equals(room.getName()));
    }

    private record PasswordAttempts(int failures, long lockedUntil) {
        static PasswordAttempts first() {
            return new PasswordAttempts(1, 0L);
        }

        // 잠금이 끝난 뒤 다시 틀리면 횟수를 처음부터 센다
        PasswordAttempts next() {
            if (lockedUntil != 0L) {
                return first();
            }
            int count = failures + 1;
            return count >= MAX_PASSWORD_ATTEMPTS
                    ? new PasswordAttempts(count, System.currentTimeMillis() + PASSWORD_LOCK_MILLIS)
                    : new PasswordAttempts(count, 0L);
        }

        boolean isLocked() {
            return lockedUntil > System.currentTimeMillis();
        }
    }
}
