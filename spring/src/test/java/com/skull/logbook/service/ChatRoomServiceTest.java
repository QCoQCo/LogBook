package com.skull.logbook.service;

import com.skull.logbook.dto.CreateChatRoomRequestDto;
import com.skull.logbook.entity.ChatRoom;
import com.skull.logbook.entity.User;
import com.skull.logbook.repository.ChatRoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ChatRoomServiceTest {

    private static final String VIP_COLLECTION = "chatroom_vip_라운지_messages";

    private ChatRoomRepository repository;
    private UserService userService;
    private FirebaseService firebaseService;
    private ChatRoomService service;

    private final ChatRoom general = room(1L, "일반 채팅방", false, null, true);
    private final ChatRoom vip = room(4L, "VIP 라운지", true, "0000", true);

    @BeforeEach
    void setUp() {
        repository = mock(ChatRoomRepository.class);
        userService = mock(UserService.class);
        firebaseService = mock(FirebaseService.class);
        when(firebaseService.isEnabled()).thenReturn(true);
        when(repository.findAllByOrderByIdAsc()).thenReturn(List.of(general, vip));
        when(repository.findById(4L)).thenReturn(Optional.of(vip));
        when(repository.save(any(ChatRoom.class))).thenAnswer(call -> call.getArgument(0));
        service = new ChatRoomService(repository, userService, mock(PasswordEncoder.class), firebaseService);
    }

    @Test
    void correctPasswordGrantsRoomAccess() {
        assertThat(service.validatePassword(4L, "0000", 7L)).isTrue();

        verify(firebaseService).addRoomMember(VIP_COLLECTION, 7L);
    }

    @Test
    void wrongPasswordDoesNotGrantAccess() {
        assertThat(service.validatePassword(4L, "1111", 7L)).isFalse();

        verify(firebaseService, never()).addRoomMember(anyString(), anyLong());
    }

    @Test
    void locksAfterTooManyWrongPasswords() {
        for (int i = 0; i < 5; i++) {
            assertThat(service.validatePassword(4L, "1111", 7L)).isFalse();
        }

        assertThatThrownBy(() -> service.validatePassword(4L, "0000", 7L))
                .isInstanceOf(IllegalArgumentException.class);
        verify(firebaseService, never()).addRoomMember(anyString(), anyLong());

        // 다른 사용자는 영향받지 않음
        assertThat(service.validatePassword(4L, "0000", 8L)).isTrue();
    }

    @Test
    void rejectsNameThatMapsToExistingRoomCollection() {
        assertThatThrownBy(() -> service.createRoom("user", createRequest("VIP 라운지!", true)))
                .isInstanceOf(IllegalArgumentException.class);

        verify(repository, never()).save(any());
    }

    @Test
    void rejectsNameWithoutUsableCharacters() {
        assertThatThrownBy(() -> service.createRoom("user", createRequest("!!!", false)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createdPrivateRoomRegistersAccessAndCreator() {
        User creator = mock(User.class);
        when(creator.getId()).thenReturn(7L);
        when(creator.getLoginId()).thenReturn("user");
        when(creator.getNickName()).thenReturn("닉네임");
        when(userService.getUserByLoginId("user")).thenReturn(creator);

        service.createRoom("user", createRequest("새 비밀방", true));

        verify(firebaseService).saveRoomAccess(List.of(new FirebaseService.RoomAccess(
                "chatroom_새_비밀방_messages", "새 비밀방", true, false)));
        verify(firebaseService).addRoomMember("chatroom_새_비밀방_messages", 7L);
    }

    @Test
    void syncMarksOnlyGeneralRoomGuestReadableAndKeepsCollidingRoomPrivate() {
        ChatRoom collision = room(9L, "VIP 라운지!", false, null, false);
        when(repository.findAllByOrderByIdAsc()).thenReturn(List.of(general, vip, collision));

        service.syncRoomAccess();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<FirebaseService.RoomAccess>> captor = ArgumentCaptor.forClass(List.class);
        verify(firebaseService).saveRoomAccess(captor.capture());
        assertThat(captor.getValue()).containsExactly(
                new FirebaseService.RoomAccess("chatroom_일반_채팅방_messages", "일반 채팅방", false, true),
                new FirebaseService.RoomAccess(VIP_COLLECTION, "VIP 라운지", true, false));
    }

    @Test
    void deletingRoomCleansFirestore() {
        ChatRoom own = room(5L, "내 방", false, null, false);
        when(repository.findById(5L)).thenReturn(Optional.of(own));

        service.deleteRoom(5L, "owner");

        verify(repository).delete(own);
        verify(firebaseService).deleteRoomData("내 방", "chatroom_내_방_messages");
    }

    private static CreateChatRoomRequestDto createRequest(String name, boolean isPrivate) {
        CreateChatRoomRequestDto dto = new CreateChatRoomRequestDto();
        dto.setName(name);
        dto.setIsPrivate(isPrivate);
        return dto;
    }

    private static ChatRoom room(Long id, String name, boolean isPrivate, String password, boolean isSystem) {
        return ChatRoom.builder().id(id).name(name).admin("a").loginId("owner").isSystem(isSystem)
                .capacity(50).currentUsers(0).isPrivate(isPrivate).password(password).build();
    }
}
