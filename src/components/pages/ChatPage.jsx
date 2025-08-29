import { useState, useRef, useEffect } from 'react';
import RGL, { WidthProvider } from 'react-grid-layout';
import { useLogBook, useAuth } from '../../context/LogBookContext';
import * as Chat from '../chat';

import './ChatPage.scss';

const ReactGridLayout = WidthProvider(RGL);

const ChatPage = () => {
    // 현재 포트 감지
    const getCurrentPort = () => {
        return window.location.port || '3000';
    };

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
    } = useLogBook();

    // Auth Context 사용
    const { currentUser: authUser, isLogin } = useAuth();

    // 채팅 관련 상태 - 초기값을 함수로 지연 초기화
    const [messageInput, setMessageInput] = useState('');
    const [currentUser, setCurrentUser] = useState(() => {
        const port = getCurrentPort();
        return {
            id: `user_${port}`, // 포트를 포함한 사용자 ID
            name: `사용자_${port}`, // 포트를 포함한 사용자 이름
            port: port,
        };
    });

    // 닉네임 편집 상태
    const [isEditingNickname, setIsEditingNickname] = useState(false);
    const [tempNickname, setTempNickname] = useState('');
    const [nicknameError, setNicknameError] = useState('');

    // 현재 사용자 정보를 useEffect로 초기화 (포트 변경 감지 및 로그인 사용자 반영)
    useEffect(() => {
        const port = getCurrentPort();
        let userName;
        let userId;

        if (isLogin && authUser) {
            // 로그인한 사용자의 nickName과 userId 사용
            userName = authUser.nickName;
            userId = authUser.id;
        } else {
            // 로그인하지 않은 경우 기본 포트 기반 이름 사용
            userName = `사용자_${port}`;
            userId = `user_${port}`;
        }

        const newUserData = {
            id: userId,
            name: userName,
            port: port,
        };

        setCurrentUser(newUserData);
        setTempNickname(userName);
    }, [isLogin, authUser]);

    // ChatPage 진입 시 다크모드 활성화
    useEffect(() => {
        setIsChatPage(true);

        // ChatPage 이탈 시 다크모드 비활성화
        return () => {
            setIsChatPage(false);
        };
    }, [setIsChatPage]);

    // 이전 채팅방 정보 저장 (채팅방 변경 시 퇴장 처리용)
    const [prevChatRoom, setPrevChatRoom] = useState(null);

    // 채팅방 변경 감지 및 이전 채팅방 퇴장 처리 (강화)
    useEffect(() => {
        const handleRoomChange = async () => {
            if (prevChatRoom && currentUser.id && currentChatRoom?.name !== prevChatRoom.name) {
                console.log(`이전 채팅방 ${prevChatRoom.name}에서 퇴장 처리 중...`);
                try {
                    // 이전 채팅방에서 퇴장
                    await leaveRoom(prevChatRoom.name, currentUser.id);
                    console.log(`이전 채팅방 ${prevChatRoom.name}에서 퇴장 완료`);
                } catch (error) {
                    console.error('이전 채팅방 퇴장 오류:', error);
                }
            }
            // 현재 채팅방을 이전 채팅방으로 저장
            if (currentChatRoom) {
                setPrevChatRoom(currentChatRoom);
            }
        };

        handleRoomChange();
    }, [currentChatRoom?.name, currentUser.id]);

    // 현재 채팅방과 사용자 변경 시 접속 관리
    useEffect(() => {
        if (currentChatRoom && currentUser.id) {
            // 새 채팅방 입장
            joinRoom(currentChatRoom.name, currentUser.id, currentUser.name, currentUser.port);

            // heartbeat 설정
            setupPresenceHeartbeat(currentChatRoom.name, currentUser.id);

            // 페이지 이탈 시 퇴장 처리
            const handleBeforeUnload = () => {
                leaveRoom(currentChatRoom.name, currentUser.id);
            };

            window.addEventListener('beforeunload', handleBeforeUnload);

            return () => {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            };
        }
    }, [currentChatRoom?.name, currentUser.id, currentUser.name, currentUser.port]); // 함수 참조 제거

    // 메시지 영역 스크롤을 위한 ref
    const messagesEndRef = useRef(null);

    // 레이아웃 변경 핸들러 (현재 사용되지 않음)
    // const onLayoutChange = (newLayout) => {
    //     setLayout(newLayout);
    // };

    // 메시지 전송 핸들러
    const handleSendMessage = async () => {
        if (messageInput.trim()) {
            // userId가 undefined인지 확인
            if (!currentUser.id) {
                console.error('currentUser.id가 없습니다:', currentUser);
                alert('사용자 정보가 없습니다. 페이지를 새로고침해주세요.');
                return;
            }

            // Firebase를 통한 메시지 전송 (포트 정보 포함)
            await sendMessage(messageInput, currentUser.id, currentUser.name, currentUser.port);
            setMessageInput('');
        }
    };

    // Enter 키로 메시지 전송
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // 메시지 삭제 핸들러
    const handleDeleteMessage = async (messageId) => {
        if (window.confirm('정말로 이 메시지를 삭제하시겠습니까?')) {
            await deleteMessage(messageId);
        }
    };

    // 에러 닫기 핸들러
    const handleCloseError = () => {
        clearError();
    };

    // 메시지 영역 자동 스크롤
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 닉네임 유효성 검증 함수
    const validateNickname = (nickname) => {
        if (!nickname.trim()) {
            return '닉네임을 입력해주세요.';
        }
        // if (nickname.trim().length < 2) {
        //     return '닉네임은 2글자 이상이어야 합니다.';
        // }
        // if (nickname.trim().length > 20) {
        //     return '닉네임은 20글자 이하여야 합니다.';
        // }
        return '';
    };

    // 닉네임 편집 시작
    const handleStartEditNickname = () => {
        setIsEditingNickname(true);
        setTempNickname(currentUser.name);
        setNicknameError('');
    };

    // 닉네임 편집 취소
    const handleCancelEditNickname = () => {
        setIsEditingNickname(false);
        setTempNickname(currentUser.name);
        setNicknameError('');
    };

    // 닉네임 저장
    const handleSaveNickname = () => {
        const error = validateNickname(tempNickname);
        if (error) {
            setNicknameError(error);
            return;
        }

        const newNickname = tempNickname.trim();
        if (newNickname === currentUser.name) {
            setIsEditingNickname(false);
            setNicknameError('');
            return;
        }

        const success = updateUserNickname(currentUser.id, newNickname);
        if (success) {
            setCurrentUser({ ...currentUser, name: newNickname });
            setIsEditingNickname(false);
            setNicknameError('');
        }
    };

    // 닉네임 입력 핸들러
    const handleNicknameInputChange = (e) => {
        setTempNickname(e.target.value);
        if (nicknameError) {
            setNicknameError('');
        }
    };

    // 닉네임 입력 시 Enter 키 처리
    const handleNicknameKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveNickname();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            handleCancelEditNickname();
        }
    };

    return (
        <div id='ChatPage'>
            <div className='container'>
                <div className='chat-area'>
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
                            {isEditingNickname ? (
                                <div className='nickname-edit-container'>
                                    <div className='nickname-input-wrapper'>
                                        <input
                                            type='text'
                                            value={tempNickname}
                                            onChange={handleNicknameInputChange}
                                            onKeyDown={handleNicknameKeyPress}
                                            placeholder='닉네임을 입력하세요'
                                            className={`nickname-input ${
                                                nicknameError ? 'error' : ''
                                            }`}
                                            maxLength={20}
                                            autoFocus
                                        />
                                        {nicknameError && (
                                            <div className='nickname-error'>{nicknameError}</div>
                                        )}
                                    </div>
                                    <div className='nickname-buttons'>
                                        <button onClick={handleSaveNickname} className='save-btn'>
                                            저장
                                        </button>
                                        <button
                                            onClick={handleCancelEditNickname}
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
                                        <span className='nickname-value'>{currentUser.name}</span>
                                    </div>
                                    <button onClick={handleStartEditNickname} className='edit-btn'>
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
                            currentUser={currentUser}
                            handleDeleteMessage={handleDeleteMessage}
                            messagesEndRef={messagesEndRef}
                        />
                    </div>
                    <div className='chat-area-input'>
                        <input
                            type='text'
                            placeholder='메시지를 입력하세요.'
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                        />
                        <button onClick={handleSendMessage} disabled={loading}>
                            {loading ? '전송 중...' : '전송'}
                        </button>
                    </div>
                </div>
                <div className='list-area'>
                    <Chat.ChatRoomList />
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
