import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import { useLogBook, useAuth } from '../../context/LogBookContext';
import { useState, useCallback, useMemo } from 'react';
import { validateRoomPassword } from '../../utils/chatService';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

const ChatRoomList = () => {
    const {
        chatRoomList,
        currentChatRoom,
        switchChatRoom,
        createChatRoom,
        deleteChatRoom,
        roomUsers,
    } = useLogBook();
    const { currentUser, isLogin } = useAuth();

    // 모든 모달 상태를 하나의 객체로 통합
    const [modals, setModals] = useState({
        showCreate: false,
        showPassword: false,
    });

    // 새 채팅방 데이터 상태
    const [newRoomData, setNewRoomData] = useState({
        name: '',
        description: '',
        capacity: 50,
        isPrivate: false,
        password: '0000',
    });

    // 비밀번호 관련 상태들을 하나의 객체로 통합
    const [passwordState, setPasswordState] = useState({
        selectedRoom: null,
        input: '',
        error: '',
    });

    // 특정 채팅방의 실제 접속 유저수 가져오기 - 메모이제이션
    const getRoomUserCount = useCallback(
        (roomName) => {
            const users = roomUsers[roomName] || [];
            return users.length;
        },
        [roomUsers]
    );

    // 표시할 채팅방 목록 메모이제이션
    const displayRooms = useMemo(() => {
        return isLogin ? chatRoomList : chatRoomList.filter((room) => room.name === '일반 채팅방');
    }, [isLogin, chatRoomList]);

    // 채팅방 클릭 핸들러 - 메모이제이션
    const handleRoomClick = useCallback(
        (room) => {
            if (room.isPrivate) {
                setPasswordState({
                    selectedRoom: room,
                    input: '',
                    error: '',
                });
                setModals((prev) => ({ ...prev, showPassword: true }));
            } else {
                switchChatRoom(room);
            }
        },
        [switchChatRoom]
    );

    // 비밀번호 확인 후 채팅방 입장 - 메모이제이션
    const handlePasswordSubmit = useCallback(() => {
        const { selectedRoom, input } = passwordState;
        if (!selectedRoom) return;

        if (validateRoomPassword(selectedRoom, input)) {
            switchChatRoom(selectedRoom);
            setModals((prev) => ({ ...prev, showPassword: false }));
            setPasswordState({
                selectedRoom: null,
                input: '',
                error: '',
            });
        } else {
            setPasswordState((prev) => ({
                ...prev,
                error: '비밀번호가 틀렸습니다.',
            }));
        }
    }, [passwordState, switchChatRoom]);

    // 비밀번호 모달 취소 - 메모이제이션
    const handlePasswordCancel = useCallback(() => {
        setModals((prev) => ({ ...prev, showPassword: false }));
        setPasswordState({
            selectedRoom: null,
            input: '',
            error: '',
        });
    }, []);

    // Enter 키로 비밀번호 입력 - 메모이제이션
    const handlePasswordKeyPress = useCallback(
        (e) => {
            if (e.key === 'Enter') {
                handlePasswordSubmit();
            } else if (e.key === 'Escape') {
                handlePasswordCancel();
            }
        },
        [handlePasswordSubmit, handlePasswordCancel]
    );

    // 채팅방 생성 핸들러 - 메모이제이션
    const handleCreateRoom = useCallback(async () => {
        if (!newRoomData.name.trim()) {
            alert('채팅방 이름을 입력해주세요.');
            return;
        }

        try {
            await createChatRoom({
                ...newRoomData,
                admin: currentUser.nickName,
                userId: currentUser.id,
            });
            setModals((prev) => ({ ...prev, showCreate: false }));
            setNewRoomData({
                name: '',
                description: '',
                capacity: 50,
                isPrivate: false,
                password: '0000',
            });
        } catch (error) {
            alert('채팅방 생성에 실패했습니다.');
            console.error('채팅방 생성 오류:', error);
        }
    }, [newRoomData, createChatRoom, currentUser]);

    // 채팅방 삭제 핸들러 - 메모이제이션
    const handleDeleteRoom = useCallback(
        async (room, e) => {
            e.stopPropagation();

            if (room.isSystem) {
                alert('기본 채팅방은 삭제할 수 없습니다.');
                return;
            }

            if (!isLogin || room.userId !== currentUser?.id) {
                alert('본인이 생성한 채팅방만 삭제할 수 있습니다.');
                return;
            }

            if (confirm(`"${room.name}" 채팅방을 삭제하시겠습니까?`)) {
                try {
                    await deleteChatRoom(room.id);
                } catch (error) {
                    alert(error.message || '채팅방 삭제에 실패했습니다.');
                    console.error('채팅방 삭제 오류:', error);
                }
            }
        },
        [isLogin, currentUser, deleteChatRoom]
    );

    return (
        <div id='ChatRoomList'>
            <div className='chat-room-list-header'>
                <h3>채팅방 목록</h3>
                {currentChatRoom && (
                    <div className='current-room'>
                        현재: <strong>{currentChatRoom.name}</strong>
                    </div>
                )}
                {isLogin && (
                    <button
                        className='create-room-btn'
                        onClick={() => setModals((prev) => ({ ...prev, showCreate: true }))}
                    >
                        채팅방 생성
                    </button>
                )}
            </div>

            {!isLogin && (
                <div className='login-notice'>
                    <p>로그인하시면 더 많은 채팅방을 이용할 수 있습니다.</p>
                </div>
            )}

            <Swiper
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'}
                coverflowEffect={{
                    rotate: 50,
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows: true,
                }}
                modules={[EffectCoverflow]}
                className='chat-room-swiper'
            >
                {displayRooms.map((room) => (
                    <SwiperSlide key={room.id}>
                        <div
                            className={`chat-room-card ${
                                currentChatRoom?.id === room.id ? 'active' : ''
                            } ${room.isSystem ? 'system-room' : 'user-room'}`}
                            onClick={() => handleRoomClick(room)}
                        >
                            <div className='room-name'>{room.name}</div>
                            <div className='room-info'>
                                <span className='room-users'>
                                    {getRoomUserCount(room.name)}/{room.capacity}
                                </span>
                                {room.isPrivate && (
                                    <span className='room-private' title='비공개 채팅방'>
                                        🔒
                                    </span>
                                )}
                            </div>
                            <div className='room-description'>{room.description}</div>
                            <div className='room-admin'>관리자: {room.admin}</div>

                            {/* 🔑 시스템 채팅방이 아닌 경우에만 삭제 버튼 표시 */}
                            {isLogin && !room.isSystem && room.userId === currentUser?.id && (
                                <button
                                    className='delete-room-btn'
                                    onClick={(e) => handleDeleteRoom(room, e)}
                                    title='채팅방 삭제'
                                >
                                    🗑️
                                </button>
                            )}

                            {/* 시스템 채팅방 표시 */}
                            {room.isSystem && (
                                <div className='system-badge' title='기본 채팅방'>
                                    🏛️ 기본방
                                </div>
                            )}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {displayRooms.length === 0 && <div className='no-rooms'>채팅방이 없습니다.</div>}

            {/* 채팅방 생성 모달 */}
            {modals.showCreate && (
                <div
                    className='modal-overlay'
                    onClick={() => setModals((prev) => ({ ...prev, showCreate: false }))}
                >
                    <div className='modal-content' onClick={(e) => e.stopPropagation()}>
                        <h3>새 채팅방 생성</h3>
                        <div className='form-group'>
                            <label>채팅방 이름 *</label>
                            <input
                                type='text'
                                value={newRoomData.name}
                                onChange={(e) =>
                                    setNewRoomData({ ...newRoomData, name: e.target.value })
                                }
                                placeholder='채팅방 이름을 입력하세요'
                                maxLength={30}
                            />
                        </div>
                        <div className='form-group'>
                            <label>설명</label>
                            <textarea
                                value={newRoomData.description}
                                onChange={(e) =>
                                    setNewRoomData({ ...newRoomData, description: e.target.value })
                                }
                                placeholder='채팅방 설명을 입력하세요'
                                maxLength={100}
                                rows={3}
                            />
                        </div>
                        <div className='form-group'>
                            <label>최대 인원</label>
                            <input
                                type='number'
                                value={newRoomData.capacity}
                                onChange={(e) =>
                                    setNewRoomData({
                                        ...newRoomData,
                                        capacity: parseInt(e.target.value) || 50,
                                    })
                                }
                                min={2}
                                max={500}
                            />
                        </div>
                        <div className='form-group'>
                            <label>
                                <input
                                    type='checkbox'
                                    checked={newRoomData.isPrivate}
                                    onChange={(e) =>
                                        setNewRoomData({
                                            ...newRoomData,
                                            isPrivate: e.target.checked,
                                        })
                                    }
                                />
                                비공개 채팅방
                            </label>
                        </div>
                        {newRoomData.isPrivate && (
                            <div className='form-group'>
                                <label>비밀번호 (4자리)</label>
                                <input
                                    type='password'
                                    value={newRoomData.password}
                                    onChange={(e) =>
                                        setNewRoomData({
                                            ...newRoomData,
                                            password: e.target.value,
                                        })
                                    }
                                    placeholder='비밀번호를 입력하세요'
                                    maxLength={4}
                                    minLength={4}
                                />
                                <small>기본값: 0000</small>
                            </div>
                        )}
                        <div className='modal-buttons'>
                            <button onClick={handleCreateRoom} className='create-btn'>
                                생성
                            </button>
                            <button
                                onClick={() =>
                                    setModals((prev) => ({ ...prev, showCreate: false }))
                                }
                                className='cancel-btn'
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 비밀번호 입력 모달 */}
            {modals.showPassword && passwordState.selectedRoom && (
                <div className='modal-overlay' onClick={handlePasswordCancel}>
                    <div
                        className='modal-content password-modal'
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>🔒 비공개 채팅방</h3>
                        <p>
                            <strong>{passwordState.selectedRoom.name}</strong>에 입장하려면
                            비밀번호를 입력하세요.
                        </p>
                        <div className='form-group'>
                            <label>비밀번호</label>
                            <input
                                type='password'
                                value={passwordState.input}
                                onChange={(e) => {
                                    setPasswordState((prev) => ({
                                        ...prev,
                                        input: e.target.value,
                                        error: '', // 입력 시 에러 초기화
                                    }));
                                }}
                                onKeyDown={handlePasswordKeyPress}
                                placeholder='4자리 비밀번호를 입력하세요'
                                maxLength={4}
                                autoFocus
                                className={passwordState.error ? 'error' : ''}
                            />
                            {passwordState.error && (
                                <div className='error-message'>{passwordState.error}</div>
                            )}
                        </div>
                        <div className='modal-buttons'>
                            <button onClick={handlePasswordSubmit} className='submit-btn'>
                                입장
                            </button>
                            <button onClick={handlePasswordCancel} className='cancel-btn'>
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatRoomList;
