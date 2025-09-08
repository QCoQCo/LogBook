import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import { useLogBook, useAuth, useYTPopup } from '../../context/LogBookContext';
import { validateRoomPassword } from '../../utils/chatService';
import * as Chat from '../chat';

import './ChatPage.scss';

const ReactGridLayout = WidthProvider(RGL);

const ChatPage = () => {
    // LogBook Context 사용
    const {
        messages,
        loading,
        error,
        sendMessage,
        deleteMessage,
        clearError,
        updateUserNickname,
        setIsChatPage,
        currentChatRoom,
        chatRoomList,
        joinRoom,
        leaveRoom,
        setupPresenceHeartbeat,
        getCurrentRoomUserCount,
        updateUserOnlineStatus,
        createChatRoom,
        switchChatRoom,
        toggleLogin,
    } = useLogBook();

    // Auth Context 사용
    const { currentUser: authUser, isLogin } = useAuth();

    // YouTube Popup Context 사용
    const { openYTPopup, playTrackInPopup, currentTrack, isPopupOpen } = useYTPopup();

    // 채팅 관련 상태들을 하나의 객체로 통합
    const [chatState, setChatState] = useState(() => ({
        messageInput: '',
        currentUser: {
            id: null,
            nickName: null,
            sessionId: null,
        },
    }));

    // 닉네임 편집 관련 상태들을 하나의 객체로 통합
    const [nicknameState, setNicknameState] = useState({
        isEditing: false,
        tempValue: '',
        error: '',
    });

    // 사용자 정보 업데이트 로직을 메모이제이션
    const updateUserInfo = useCallback(() => {
        if (isLogin && authUser) {
            // 로그인한 사용자만 정보 설정
            const newUserData = {
                id: authUser.id,
                nickName: authUser.nickName,
                sessionId: null,
            };

            setChatState((prev) => ({
                ...prev,
                currentUser: newUserData,
            }));
            setNicknameState((prev) => ({
                ...prev,
                tempValue: authUser.nickName,
            }));
        } else {
            // 비로그인 사용자는 빈 정보로 설정
            setChatState((prev) => ({
                ...prev,
                currentUser: {
                    id: null,
                    nickName: null,
                    sessionId: null,
                },
            }));
            setNicknameState((prev) => ({
                ...prev,
                tempValue: '',
            }));
        }
    }, [isLogin, authUser]);

    // 현재 사용자 정보 초기화
    useEffect(() => {
        updateUserInfo();
    }, [updateUserInfo]);

    // 로그인 상태 변경 시 채팅방 퇴장 처리
    useEffect(() => {
        const { currentUser: user } = chatState;

        // 로그아웃된 경우 (이전에 로그인되어 있었고 현재 로그아웃된 경우)
        if (!isLogin && prevUserIdRef.current) {
            const handleLogout = async () => {
                try {
                    // 이전 사용자 ID로 모든 채팅방에서 퇴장 처리
                    await leaveRoom(currentChatRoom?.name, prevUserIdRef.current);
                    console.log('로그아웃 감지: 채팅방에서 퇴장 처리 완료');
                } catch (error) {
                    console.error('로그아웃 시 채팅방 퇴장 처리 오류:', error);
                }
                // 이전 사용자 ID 초기화
                prevUserIdRef.current = null;
            };

            handleLogout();
        }
    }, [isLogin, currentChatRoom?.name, leaveRoom]);

    // ChatPage 진입 시 다크모드 활성화
    useEffect(() => {
        setIsChatPage(true);

        // ChatPage 이탈 시 다크모드 비활성화
        return () => {
            setIsChatPage(false);
        };
    }, [setIsChatPage]);

    // 이전 채팅방 정보 저장
    const [prevChatRoom, setPrevChatRoom] = useState(null);
    // 이전 사용자 ID 추적 (로그인 전 게스트 → 로그인 사용 전환 시 정리용)
    const prevUserIdRef = useRef(null);

    // 채팅방 유저 리스트 모달 상태
    const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

    // 채팅방 생성 및 비밀번호 모달 상태
    const [roomModals, setRoomModals] = useState({
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

    // 비밀번호 관련 상태
    const [passwordState, setPasswordState] = useState({
        selectedRoom: null,
        input: '',
        error: '',
    });

    // 채팅방 관리를 위한 통합 useEffect
    useEffect(() => {
        const { currentUser: user } = chatState;

        // 로그인하지 않은 사용자는 채팅방 입장 차단
        if (!isLogin || !currentChatRoom || !user.id) return;

        // 이전 채팅방 퇴장 처리
        const handlePreviousRoomLeave = async () => {
            if (prevChatRoom && currentChatRoom.name !== prevChatRoom.name) {
                try {
                    await leaveRoom(prevChatRoom.name, user.id);
                } catch (error) {
                    console.error('이전 채팅방 퇴장 오류:', error);
                }
            }
        };

        // 현재 채팅방 입장 처리
        const handleCurrentRoomJoin = () => {
            joinRoom(currentChatRoom.name, user.id, user.nickName, user.sessionId);
            setupPresenceHeartbeat(currentChatRoom.name, user.id);
        };

        // 이벤트 핸들러들을 메모이제이션
        const eventHandlers = {
            beforeUnload: () => {
                try {
                    updateUserOnlineStatus(currentChatRoom.name, user.id, false);
                    leaveRoom(currentChatRoom.name, user.id);
                } catch (error) {
                    console.error('페이지 종료 시 퇴장 처리 오류:', error);
                }
            },
            pageHide: () => leaveRoom(currentChatRoom.name, user.id),
            unload: () => leaveRoom(currentChatRoom.name, user.id),
            visibilityChange: async () => {
                const isVisible = document.visibilityState === 'visible';
                try {
                    // 탭이 숨겨지면 오프라인으로, 보이면 온라인으로 처리
                    await updateUserOnlineStatus(currentChatRoom.name, user.id, isVisible);

                    // 탭이 다시 보일 때 heartbeat 재시작
                    if (isVisible) {
                        setupPresenceHeartbeat(currentChatRoom.name, user.id);
                    }
                } catch (error) {
                    console.error('온라인 상태 업데이트 오류:', error);
                }
            },
        };

        // 순차적으로 처리
        const initializeRoom = async () => {
            // 사용자 ID가 변경되었다면 이전 사용자 presence 정리 (동일 채팅방 내 전환 케이스)
            const prevUserId = prevUserIdRef.current;
            if (prevUserId && prevUserId !== user.id) {
                try {
                    await leaveRoom(currentChatRoom.name, prevUserId);
                } catch (error) {
                    console.error('이전 사용자 presence 정리 오류:', error);
                }
            }
            await handlePreviousRoomLeave();
            handleCurrentRoomJoin();
            setPrevChatRoom(currentChatRoom);
            // 현재 사용자 ID를 기록
            prevUserIdRef.current = user.id;
        };

        initializeRoom();

        // 이벤트 리스너 등록
        window.addEventListener('beforeunload', eventHandlers.beforeUnload);
        window.addEventListener('pagehide', eventHandlers.pageHide);
        window.addEventListener('unload', eventHandlers.unload);
        document.addEventListener('visibilitychange', eventHandlers.visibilityChange);

        // 클린업
        return () => {
            window.removeEventListener('beforeunload', eventHandlers.beforeUnload);
            window.removeEventListener('pagehide', eventHandlers.pageHide);
            window.removeEventListener('unload', eventHandlers.unload);
            document.removeEventListener('visibilitychange', eventHandlers.visibilityChange);
        };
    }, [
        currentChatRoom?.name,
        chatState.currentUser.id,
        chatState.currentUser.nickName,
        chatState.currentUser.sessionId,
        prevChatRoom?.name,
        // 함수들은 useCallback으로 메모이제이션되어 있으므로 안전하게 제거 가능
    ]);

    // 메시지 영역 스크롤을 위한 ref
    const messagesEndRef = useRef(null);

    // 레이아웃 변경 핸들러 (현재 사용되지 않음)
    // const onLayoutChange = (newLayout) => {
    //     setLayout(newLayout);
    // };

    // 메시지 전송 핸들러 - 메모이제이션
    const handleSendMessage = useCallback(async () => {
        const { messageInput, currentUser } = chatState;

        if (messageInput.trim()) {
            if (!currentUser.id) {
                console.error('currentUser.id가 없습니다:', currentUser);
                alert('사용자 정보가 없습니다. 페이지를 새로고침해주세요.');
                return;
            }

            await sendMessage(
                messageInput,
                currentUser.id,
                currentUser.nickName,
                currentUser.sessionId
            );

            setChatState((prev) => ({ ...prev, messageInput: '' }));
        }
    }, [chatState, sendMessage]);

    // Enter 키로 메시지 전송 - 메모이제이션
    const handleKeyPress = useCallback(
        (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        },
        [handleSendMessage]
    );

    // 메시지 삭제 핸들러 - 메모이제이션
    const handleDeleteMessage = useCallback(
        async (messageId) => {
            if (window.confirm('정말로 이 메시지를 삭제하시겠습니까?')) {
                await deleteMessage(messageId);
            }
        },
        [deleteMessage]
    );

    // 에러 닫기 핸들러 - 메모이제이션
    const handleCloseError = useCallback(() => {
        clearError();
    }, [clearError]);

    // 메시지 영역 자동 스크롤 - 메모이제이션
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // 메시지 변경 시 자동 스크롤
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // 닉네임 관련 함수들을 메모이제이션
    const nicknameHandlers = useMemo(
        () => ({
            validate: (nickname) => {
                if (!nickname.trim()) {
                    return '닉네임을 입력해주세요.';
                }
                return '';
            },

            startEdit: () => {
                setNicknameState({
                    isEditing: true,
                    tempValue: chatState.currentUser.nickName,
                    error: '',
                });
            },

            cancelEdit: () => {
                setNicknameState({
                    isEditing: false,
                    tempValue: chatState.currentUser.nickName,
                    error: '',
                });
            },

            save: () => {
                const error = nicknameHandlers.validate(nicknameState.tempValue);
                if (error) {
                    setNicknameState((prev) => ({ ...prev, error }));
                    return;
                }

                const newNickname = nicknameState.tempValue.trim();
                if (newNickname === chatState.currentUser.nickName) {
                    setNicknameState((prev) => ({ ...prev, isEditing: false, error: '' }));
                    return;
                }

                const success = updateUserNickname(chatState.currentUser.id, newNickname);
                if (success) {
                    setChatState((prev) => ({
                        ...prev,
                        currentUser: { ...prev.currentUser, nickName: newNickname },
                    }));
                    setNicknameState({
                        isEditing: false,
                        tempValue: newNickname,
                        error: '',
                    });
                }
            },

            handleInputChange: (e) => {
                setNicknameState((prev) => ({
                    ...prev,
                    tempValue: e.target.value,
                    error: prev.error ? '' : prev.error,
                }));
            },

            handleKeyPress: (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    nicknameHandlers.save();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    nicknameHandlers.cancelEdit();
                }
            },
        }),
        [chatState.currentUser, nicknameState, updateUserNickname]
    );

    // 채팅방 유저 리스트 모달 핸들러들
    const usersModalHandlers = useMemo(
        () => ({
            open: () => setIsUsersModalOpen(true),
            close: () => setIsUsersModalOpen(false),
        }),
        []
    );

    // 채팅방 생성 모달 핸들러들
    const createRoomHandlers = useMemo(
        () => ({
            open: () => setRoomModals((prev) => ({ ...prev, showCreate: true })),
            close: () => {
                setRoomModals((prev) => ({ ...prev, showCreate: false }));
                setNewRoomData({
                    name: '',
                    description: '',
                    capacity: 50,
                    isPrivate: false,
                    password: '0000',
                });
            },
            create: async () => {
                if (!newRoomData.name.trim()) {
                    alert('채팅방 이름을 입력해주세요.');
                    return;
                }

                try {
                    await createChatRoom({
                        ...newRoomData,
                        admin: authUser.nickName,
                        userId: authUser.id,
                    });
                    createRoomHandlers.close();
                } catch (error) {
                    alert('채팅방 생성에 실패했습니다.');
                    console.error('채팅방 생성 오류:', error);
                }
            },
        }),
        [newRoomData, createChatRoom, authUser]
    );

    // 비밀번호 모달 핸들러들
    const passwordModalHandlers = useMemo(
        () => ({
            open: (room) => {
                setPasswordState({
                    selectedRoom: room,
                    input: '',
                    error: '',
                });
                setRoomModals((prev) => ({ ...prev, showPassword: true }));
            },
            close: () => {
                setRoomModals((prev) => ({ ...prev, showPassword: false }));
                setPasswordState({
                    selectedRoom: null,
                    input: '',
                    error: '',
                });
            },
            submit: () => {
                const { selectedRoom, input } = passwordState;
                if (!selectedRoom) return;

                if (validateRoomPassword(selectedRoom, input)) {
                    switchChatRoom(selectedRoom);
                    passwordModalHandlers.close();
                } else {
                    setPasswordState((prev) => ({
                        ...prev,
                        error: '비밀번호가 틀렸습니다.',
                    }));
                }
            },
            handleKeyPress: (e) => {
                if (e.key === 'Enter') {
                    passwordModalHandlers.submit();
                } else if (e.key === 'Escape') {
                    passwordModalHandlers.close();
                }
            },
        }),
        [passwordState, switchChatRoom]
    );

    return (
        <div id='ChatPage'>
            <div className='container'>
                <div className='chat-area'>
                    <div className='chat-wrapper'>
                        <div className='chat-area-header'>
                            <div className='chat-area-header-title'>
                                {currentChatRoom && (
                                    <div
                                        className='current-chat-room clickable'
                                        onClick={usersModalHandlers.open}
                                        title='클릭하여 접속 중인 유저 목록 보기'
                                    >
                                        <span className='room-indicator'>📍</span>
                                        <span className='room-name'>{currentChatRoom.name}</span>
                                        <span className='room-users'>
                                            ({getCurrentRoomUserCount()}/{currentChatRoom.capacity})
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className='chat-nick-name-section'>
                                {isLogin &&
                                    (nicknameState.isEditing ? (
                                        <div className='nickname-edit-container'>
                                            <div className='nickname-input-wrapper'>
                                                <input
                                                    type='text'
                                                    value={nicknameState.tempValue}
                                                    onChange={nicknameHandlers.handleInputChange}
                                                    onKeyDown={nicknameHandlers.handleKeyPress}
                                                    placeholder='닉네임을 입력하세요'
                                                    className={`nickname-input ${
                                                        nicknameState.error ? 'error' : ''
                                                    }`}
                                                    maxLength={20}
                                                    autoFocus
                                                />
                                                {nicknameState.error && (
                                                    <div className='nickname-error'>
                                                        {nicknameState.error}
                                                    </div>
                                                )}
                                            </div>
                                            <div className='nickname-buttons'>
                                                <button
                                                    onClick={nicknameHandlers.save}
                                                    className='save-btn'
                                                >
                                                    저장
                                                </button>
                                                <button
                                                    onClick={nicknameHandlers.cancelEdit}
                                                    className='cancel-btn'
                                                >
                                                    취소
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className='nickname-display-container'>
                                            <div className='current-nickname'>
                                                <span className='nickname-label'>닉네임:</span>
                                                <span className='nickname-value'>
                                                    {chatState.currentUser.nickName}
                                                </span>
                                            </div>
                                            <button
                                                onClick={nicknameHandlers.startEdit}
                                                className='edit-btn'
                                            >
                                                닉네임 수정
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                        <div className='chat-area-content'>
                            {/* Firebase 실시간 메시지 표시 */}
                            {loading && <div className='loading'>메시지 로딩 중...</div>}
                            {error && (
                                <div className='error'>
                                    {error}
                                    <button onClick={handleCloseError} className='error-close'>
                                        ×
                                    </button>
                                </div>
                            )}

                            {/* 디버깅 정보 (개발 모드에서만 표시) */}
                            {process.env.NODE_ENV === 'development' && currentChatRoom && (
                                <div className='debug-info'>
                                    <small>
                                        현재 채팅방: {currentChatRoom.name} | 메시지 수:{' '}
                                        {messages.length}
                                    </small>
                                </div>
                            )}

                            <Chat.ChatMessage
                                messages={messages}
                                currentUser={chatState.currentUser}
                                handleDeleteMessage={handleDeleteMessage}
                                messagesEndRef={messagesEndRef}
                                openYTPopup={openYTPopup}
                                playTrackInPopup={playTrackInPopup}
                                currentTrack={currentTrack}
                                isPopupOpen={isPopupOpen}
                            />
                        </div>
                        <div className='chat-area-input'>
                            {isLogin ? (
                                <>
                                    <input
                                        type='text'
                                        placeholder='메시지를 입력하세요.'
                                        value={chatState.messageInput}
                                        onChange={(e) =>
                                            setChatState((prev) => ({
                                                ...prev,
                                                messageInput: e.target.value,
                                            }))
                                        }
                                        onKeyPress={handleKeyPress}
                                    />
                                    <button onClick={handleSendMessage} disabled={loading}>
                                        {loading ? '전송 중...' : '전송'}
                                    </button>
                                </>
                            ) : (
                                <div className='login-required-message'>
                                    <span>💬 채팅을 이용하려면 로그인이 필요합니다</span>
                                    <button
                                        className='login-prompt-btn'
                                        onClick={() => {
                                            toggleLogin();
                                        }}
                                    >
                                        로그인하기
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className='list-area'>
                    <div className='chat-list-area'>
                        <Chat.ChatRoomList
                            onCreateRoom={createRoomHandlers.open}
                            onPasswordModal={passwordModalHandlers.open}
                        />
                    </div>
                    <div className='user-playlist-area'>
                        <Chat.UserPlaylist
                            openYTPopup={openYTPopup}
                            playTrackInPopup={playTrackInPopup}
                            currentTrack={currentTrack}
                            isPopupOpen={isPopupOpen}
                        />
                    </div>
                </div>
            </div>

            {/* 채팅방 유저 리스트 모달 */}
            <Chat.ChatRoomUsersModal
                isOpen={isUsersModalOpen}
                onClose={usersModalHandlers.close}
                roomName={currentChatRoom?.name}
                currentUser={chatState.currentUser}
            />

            {/* 채팅방 생성 모달 */}
            <Chat.CreateChatRoomModal
                isOpen={roomModals.showCreate}
                onClose={createRoomHandlers.close}
                newRoomData={newRoomData}
                setNewRoomData={setNewRoomData}
                onCreateRoom={createRoomHandlers.create}
            />

            {/* 비밀번호 입력 모달 */}
            <Chat.PasswordModal
                isOpen={roomModals.showPassword}
                onClose={passwordModalHandlers.close}
                selectedRoom={passwordState.selectedRoom}
                passwordInput={passwordState.input}
                setPasswordInput={(value) =>
                    setPasswordState((prev) => ({ ...prev, input: value, error: '' }))
                }
                error={passwordState.error}
                onSubmit={passwordModalHandlers.submit}
                onKeyPress={passwordModalHandlers.handleKeyPress}
            />
        </div>
    );
};

export default ChatPage;
