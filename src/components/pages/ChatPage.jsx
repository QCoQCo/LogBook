import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import { useLogBook, useAuth } from '../../context/LogBookContext';
import * as Chat from '../chat';

import './ChatPage.scss';

const ReactGridLayout = WidthProvider(RGL);

const ChatPage = () => {
    // 세션 ID 관련 유틸리티 함수들을 메모이제이션
    const sessionUtils = useMemo(
        () => ({
            generateSessionId: () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            getOrCreateSessionId: () => {
                let sessionId = sessionStorage.getItem('chatSessionId');
                if (!sessionId) {
                    sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    sessionStorage.setItem('chatSessionId', sessionId);
                }
                return sessionId;
            },
        }),
        []
    );

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
    } = useLogBook();

    // Auth Context 사용
    const { currentUser: authUser, isLogin } = useAuth();

    // 채팅 관련 상태들을 하나의 객체로 통합
    const [chatState, setChatState] = useState(() => {
        const sessionId = sessionUtils.getOrCreateSessionId();
        return {
            messageInput: '',
            currentUser: {
                id: `guest_${sessionId}`,
                name: `게스트_${sessionId.slice(-4)}`,
                sessionId: sessionId,
            },
        };
    });

    // 닉네임 편집 관련 상태들을 하나의 객체로 통합
    const [nicknameState, setNicknameState] = useState({
        isEditing: false,
        tempValue: '',
        error: '',
    });

    // 사용자 정보 업데이트 로직을 메모이제이션
    const updateUserInfo = useCallback(() => {
        const sessionId = sessionUtils.getOrCreateSessionId();
        let userName, userId, userSessionId;

        if (isLogin && authUser) {
            userName = authUser.nickName;
            userId = authUser.id;
            userSessionId = null;
        } else {
            userName = `게스트_${sessionId.slice(-4)}`;
            userId = `guest_${sessionId}`;
            userSessionId = sessionId;
        }

        const newUserData = {
            id: userId,
            name: userName,
            sessionId: userSessionId,
        };

        setChatState((prev) => ({
            ...prev,
            currentUser: newUserData,
        }));
        setNicknameState((prev) => ({
            ...prev,
            tempValue: userName,
        }));
    }, [isLogin, authUser, sessionUtils]);

    // 현재 사용자 정보 초기화
    useEffect(() => {
        updateUserInfo();
    }, [updateUserInfo]);

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

    // 채팅방 관리를 위한 통합 useEffect
    useEffect(() => {
        const { currentUser: user } = chatState;

        if (!currentChatRoom || !user.id) return;

        // 이전 채팅방 퇴장 처리
        const handlePreviousRoomLeave = async () => {
            if (prevChatRoom && currentChatRoom.name !== prevChatRoom.name) {
                console.log(`이전 채팅방 ${prevChatRoom.name}에서 퇴장 처리 중...`);
                try {
                    await leaveRoom(prevChatRoom.name, user.id);
                    console.log(`이전 채팅방 ${prevChatRoom.name}에서 퇴장 완료`);
                } catch (error) {
                    console.error('이전 채팅방 퇴장 오류:', error);
                }
            }
        };

        // 현재 채팅방 입장 처리
        const handleCurrentRoomJoin = () => {
            joinRoom(currentChatRoom.name, user.id, user.name, user.sessionId);
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
                    await updateUserOnlineStatus(currentChatRoom.name, user.id, isVisible);
                } catch (error) {
                    console.error('온라인 상태 업데이트 오류:', error);
                }
            },
        };

        // 순차적으로 처리
        const initializeRoom = async () => {
            await handlePreviousRoomLeave();
            handleCurrentRoomJoin();
            setPrevChatRoom(currentChatRoom);
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
        chatState.currentUser.name,
        chatState.currentUser.sessionId,
        prevChatRoom?.name,
        joinRoom,
        leaveRoom,
        setupPresenceHeartbeat,
        updateUserOnlineStatus,
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
                currentUser.name,
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
                    tempValue: chatState.currentUser.name,
                    error: '',
                });
            },

            cancelEdit: () => {
                setNicknameState({
                    isEditing: false,
                    tempValue: chatState.currentUser.name,
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
                if (newNickname === chatState.currentUser.name) {
                    setNicknameState((prev) => ({ ...prev, isEditing: false, error: '' }));
                    return;
                }

                const success = updateUserNickname(chatState.currentUser.id, newNickname);
                if (success) {
                    setChatState((prev) => ({
                        ...prev,
                        currentUser: { ...prev.currentUser, name: newNickname },
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

    return (
        <div id='ChatPage'>
            <div className='container'>
                <div className='chat-area'>
                    <div className='chat-wrapper'>
                        <div className='chat-area-header'>
                            <div className='chat-area-header-title'>
                                {currentChatRoom && (
                                    <div className='current-chat-room'>
                                        <span className='room-indicator'>📍</span>
                                        <span className='room-name'>{currentChatRoom.name}</span>
                                        <span className='room-users'>
                                            ({getCurrentRoomUserCount()}/{currentChatRoom.capacity})
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className='chat-nick-name-section'>
                                {nicknameState.isEditing ? (
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
                                                {chatState.currentUser.name}
                                            </span>
                                        </div>
                                        <button
                                            onClick={nicknameHandlers.startEdit}
                                            className='edit-btn'
                                        >
                                            닉네임 수정
                                        </button>
                                    </div>
                                )}
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
                            />
                        </div>
                        <div className='chat-area-input'>
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
                        </div>
                    </div>
                </div>
                <div className='list-area'>
                    <div className='chat-list-area'>
                        <Chat.ChatRoomList />
                    </div>
                    <div className='user-playlist-area'>
                        <Chat.UserPlayList />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
