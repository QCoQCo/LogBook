import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    sendMessageToRoom,
    subscribeToRoomMessages,
    deleteMessageFromRoom,
    getChatRoomList,
    initializeChatRoom,
    createChatRoom as createChatRoomService,
    deleteChatRoom as deleteChatRoomService,
    deleteAllMessagesFromRoom,
    joinChatRoom,
    leaveChatRoom,
    updateUserPresence,
    updateUserOnlineStatus,
    subscribeToRoomUsers,
    subscribeToChatRooms,
    initializeDefaultChatRooms,
    cleanupExpiredPresence,
    cleanupOfflinePresence,
    cleanupOfflinePresenceForRoom,
} from '../utils/chatService';

// ChatContext 생성
const ChatContext = createContext();

// 공통 유틸리티 함수들
const handleAsyncOperation = async (operation, setLoading, setError, errorMessage) => {
    try {
        setLoading(true);
        setError(null);
        return await operation();
    } catch (error) {
        setError(errorMessage);
        console.error(errorMessage, error);
        throw error;
    } finally {
        setLoading(false);
    }
};

const safeUnsubscribe = (unsubscribe, errorMessage) => {
    if (unsubscribe) {
        try {
            unsubscribe();
        } catch (error) {
            console.error(errorMessage, error);
        }
    }
};

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    // 채팅방 관련 상태
    const [currentChatRoom, setCurrentChatRoom] = useState(null);
    const [chatRoomList, setChatRoomList] = useState([]);
    const [messagesUnsubscribe, setMessagesUnsubscribe] = useState(null);

    // 실시간 접속 유저 관리
    const [roomUsers, setRoomUsers] = useState({});
    const [usersUnsubscribe, setUsersUnsubscribe] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [presenceHeartbeat, setPresenceHeartbeat] = useState(null);

    // 채팅방 목록 실시간 구독
    const [chatRoomsUnsubscribe, setChatRoomsUnsubscribe] = useState(null);

    // 구독 해제 통합 함수
    const cleanupSubscriptions = useCallback(() => {
        safeUnsubscribe(messagesUnsubscribe, '메시지 구독 해제 오류:');
        safeUnsubscribe(usersUnsubscribe, '유저 구독 해제 오류:');
        safeUnsubscribe(chatRoomsUnsubscribe, '채팅방 목록 구독 해제 오류:');

        setMessagesUnsubscribe(null);
        setUsersUnsubscribe(null);
        setChatRoomsUnsubscribe(null);
    }, [messagesUnsubscribe, usersUnsubscribe, chatRoomsUnsubscribe]);

    // 채팅방 목록 실시간 구독 설정
    const loadChatRoomList = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // 🔑 기본 채팅방 초기화 (최초 1회)
            await initializeDefaultChatRooms();

            // 실시간 채팅방 목록 구독
            const unsubscribe = subscribeToChatRooms(
                (roomList) => {
                    setChatRoomList(roomList);

                    // 현재 채팅방이 없으면 첫 번째 채팅방으로 설정
                    if (!currentChatRoom && roomList.length > 0) {
                        const defaultRoom =
                            roomList.find((room) => room.name === '일반 채팅방') || roomList[0];
                        setCurrentChatRoom(defaultRoom);
                    }
                },
                (error) => {
                    setError('채팅방 목록 로딩에 실패했습니다.');
                    console.error('채팅방 목록 구독 오류:', error);
                }
            );

            setChatRoomsUnsubscribe(() => unsubscribe);
        } catch (error) {
            setError('채팅방 목록 초기화에 실패했습니다.');
            console.error('채팅방 목록 로딩 오류:', error);
        } finally {
            setLoading(false);
        }
    }, [currentChatRoom]);

    // 채팅방 변경 (강력한 퇴장 처리 포함)
    const switchChatRoom = useCallback(
        async (chatRoom) => {
            if (currentChatRoom?.name === chatRoom.name) return;

            try {
                // 이전 채팅방에서 강제 퇴장 처리
                if (currentChatRoom && currentUserId) {
                    await leaveChatRoom(currentChatRoom.name, currentUserId);
                }

                // 이전 구독 해제
                cleanupSubscriptions();

                // 새 채팅방 설정
                setCurrentChatRoom(chatRoom);
                setMessages([]);
            } catch (error) {
                console.error('채팅방 변경 중 오류:', error);
                // 오류가 있어도 채팅방 변경은 계속 진행
                setCurrentChatRoom(chatRoom);
                setMessages([]);
            }
        },
        [currentChatRoom, messagesUnsubscribe, usersUnsubscribe, currentUserId]
    );

    // 메시지 전송 함수 (채팅방별)
    const sendMessage = useCallback(
        async (messageText, userId, userName, port = null) => {
            if (!currentChatRoom) {
                setError('채팅방이 선택되지 않았습니다.');
                return;
            }

            await handleAsyncOperation(
                () => sendMessageToRoom(currentChatRoom.name, messageText, userId, userName, port),
                setLoading,
                setError,
                '메시지 전송에 실패했습니다.'
            );
        },
        [currentChatRoom]
    );

    // 현재 채팅방의 실시간 메시지 구독 (의존성 제거하여 무한 루프 방지)
    const subscribeToCurrentRoomMessages = useCallback((roomName) => {
        if (!roomName) return null;

        try {
            const unsubscribe = subscribeToRoomMessages(
                roomName,
                (messageList) => {
                    setMessages(messageList);
                },
                (error) => {
                    // 권한 오류인 경우 빈 배열로 설정 (collection이 아직 없는 경우)
                    if (error.code === 'permission-denied') {
                        setMessages([]);
                        return;
                    }
                    setError('메시지 로딩에 실패했습니다.');
                    console.error('메시지 구독 오류:', error);
                },
                100 // 메시지 개수 제한
            );

            return unsubscribe;
        } catch (err) {
            setError('메시지 구독 설정에 실패했습니다.');
            console.error('메시지 구독 설정 오류:', err);
            return null;
        }
    }, []);

    // 메시지 삭제 함수 (채팅방별)
    const deleteMessage = useCallback(
        async (messageId) => {
            if (!currentChatRoom) {
                setError('채팅방이 선택되지 않았습니다.');
                return;
            }

            await handleAsyncOperation(
                () => deleteMessageFromRoom(currentChatRoom.name, messageId),
                setLoading,
                setError,
                '메시지 삭제에 실패했습니다.'
            );
        },
        [currentChatRoom]
    );

    // 에러 초기화 함수
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // 온라인 사용자 업데이트 함수
    const updateOnlineUsers = useCallback((users) => {
        setOnlineUsers(users);
    }, []);

    // 채팅방 생성 함수
    const createChatRoom = useCallback(async (roomData) => {
        try {
            return await handleAsyncOperation(
                () => createChatRoomService(roomData),
                setLoading,
                setError,
                '채팅방 생성에 실패했습니다.'
            );
        } catch (err) {
            throw new Error('채팅방 생성에 실패했습니다.');
        }
    }, []);

    // 채팅방 삭제 함수
    const deleteChatRoom = useCallback(
        async (roomId) => {
            try {
                await handleAsyncOperation(
                    () => deleteChatRoomService(roomId),
                    setLoading,
                    setError,
                    '채팅방 삭제에 실패했습니다.'
                );

                // 삭제된 채팅방이 현재 선택된 채팅방인 경우 다른 채팅방으로 변경
                if (currentChatRoom?.id === roomId) {
                    const remainingRooms = chatRoomList.filter((room) => room.id !== roomId);
                    if (remainingRooms.length > 0) {
                        setCurrentChatRoom(remainingRooms[0]);
                    } else {
                        setCurrentChatRoom(null);
                    }
                }
            } catch (err) {
                throw new Error('채팅방 삭제에 실패했습니다.');
            }
        },
        [currentChatRoom, chatRoomList]
    );

    // 실시간 접속 유저 관리 함수들
    const joinRoom = useCallback(async (roomName, userId, userName, port) => {
        try {
            await joinChatRoom(roomName, userId, userName, port);
            setCurrentUserId(userId);
        } catch (error) {
            console.error('채팅방 입장 오류:', error);
        }
    }, []);

    const leaveRoom = useCallback(
        async (roomName, userId) => {
            try {
                await leaveChatRoom(roomName, userId);

                // heartbeat 정리
                if (presenceHeartbeat) {
                    clearInterval(presenceHeartbeat);
                    setPresenceHeartbeat(null);
                }
            } catch (error) {
                console.error('채팅방 퇴장 오류:', error);
            }
        },
        [presenceHeartbeat]
    );

    // heartbeat 설정 (주기적 생존 신호)
    const setupPresenceHeartbeat = useCallback(
        (roomName, userId) => {
            // 기존 heartbeat 정리
            if (presenceHeartbeat) {
                clearInterval(presenceHeartbeat);
                setPresenceHeartbeat(null);
            }

            // 30초마다 생존 신호 전송
            const heartbeatInterval = setInterval(async () => {
                try {
                    await updateUserPresence(roomName, userId);
                } catch (error) {
                    console.error('Heartbeat 전송 오류:', error);
                }
            }, 30000); // 30초 간격

            setPresenceHeartbeat(heartbeatInterval);
        },
        [presenceHeartbeat]
    );

    // 채팅방 유저 구독 (의존성 제거하여 무한 루프 방지)
    const subscribeToCurrentRoomUsers = useCallback((roomName) => {
        if (!roomName) return null;

        try {
            const unsubscribe = subscribeToRoomUsers(
                roomName,
                (users) => {
                    setRoomUsers((prev) => {
                        // 동일한 데이터인 경우 업데이트하지 않음
                        if (prev[roomName] === users) return prev;
                        return { ...prev, [roomName]: users };
                    });
                },
                (error) => {
                    console.error('유저 구독 오류:', error);
                }
            );

            return unsubscribe;
        } catch (error) {
            console.error('유저 구독 설정 오류:', error);
            return null;
        }
    }, []);

    // 현재 채팅방의 실제 접속 유저수 가져오기
    const getCurrentRoomUserCount = useCallback(() => {
        if (!currentChatRoom) return 0;
        const users = roomUsers[currentChatRoom.name] || [];
        return users.length;
    }, [currentChatRoom, roomUsers]);

    // 채팅방 목록 로드 (컴포넌트 마운트 시)
    useEffect(() => {
        loadChatRoomList();
    }, [loadChatRoomList]);

    // 현재 채팅방 변경 시 메시지 및 유저 구독
    useEffect(() => {
        let messageUnsubscribe = null;
        let userUnsubscribe = null;

        if (currentChatRoom) {
            // 이전 구독 해제
            cleanupSubscriptions();

            // 새 채팅방 메시지 구독
            messageUnsubscribe = subscribeToCurrentRoomMessages(currentChatRoom.name);
            setMessagesUnsubscribe(() => messageUnsubscribe);

            // 새 채팅방 유저 구독
            userUnsubscribe = subscribeToCurrentRoomUsers(currentChatRoom.name);
            setUsersUnsubscribe(() => userUnsubscribe);
        } else {
            // 채팅방이 없는 경우 메시지 초기화
            setMessages([]);
            setRoomUsers({});
        }

        // 컴포넌트 언마운트 또는 채팅방 변경 시 구독 해제
        return () => {
            safeUnsubscribe(messageUnsubscribe, '메시지 구독 정리 오류:');
            safeUnsubscribe(userUnsubscribe, '유저 구독 정리 오류:');
        };
    }, [currentChatRoom]); // subscribeToCurrentRoomMessages, subscribeToCurrentRoomUsers 의존성 제거

    // 컴포넌트 언마운트 시 채팅방 목록 구독 해제
    useEffect(() => {
        return () => {
            safeUnsubscribe(chatRoomsUnsubscribe, '채팅방 목록 구독 해제 오류:');
        };
    }, [chatRoomsUnsubscribe]);

    // 주기적 정리 작업 시스템
    useEffect(() => {
        // 초기 정리 (앱 시작 후 30초 후)
        const initialCleanupTimeout = setTimeout(() => {
            cleanupExpiredPresence(10).catch(console.error);
            cleanupOfflinePresence(20).catch(console.error);
        }, 30000);

        // 주기적 정리 (5분마다)
        const periodicCleanupInterval = setInterval(() => {
            cleanupExpiredPresence(5).catch(console.error); // 5분 이상 비활성 유저 정리
            cleanupOfflinePresence(10).catch(console.error); // 10분 이상 오프라인 유저 정리
        }, 5 * 60 * 1000); // 5분 간격

        return () => {
            clearTimeout(initialCleanupTimeout);
            clearInterval(periodicCleanupInterval);
        };
    }, []);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            // heartbeat 정리
            if (presenceHeartbeat) {
                clearInterval(presenceHeartbeat);
            }

            // 현재 사용자가 모든 채팅방에서 퇴장 처리
            if (currentUserId && currentChatRoom) {
                leaveChatRoom(currentChatRoom.name, currentUserId).catch(console.error);
            }
        };
    }, []); // 컴포넌트 언마운트 시에만 실행되도록 빈 배열

    // 메시지 관련 값들
    const messageValues = useMemo(
        () => ({
            messages,
            loading,
            error,
            sendMessage,
            deleteMessage,
            clearError,
        }),
        [messages, loading, error, sendMessage, deleteMessage, clearError]
    );

    // 채팅방 관련 값들
    const chatRoomValues = useMemo(
        () => ({
            currentChatRoom,
            chatRoomList,
            switchChatRoom,
            loadChatRoomList,
            createChatRoom,
            deleteChatRoom,
        }),
        [
            currentChatRoom,
            chatRoomList,
            switchChatRoom,
            loadChatRoomList,
            createChatRoom,
            deleteChatRoom,
        ]
    );

    // 실시간 접속 유저 관련 값들
    const presenceValues = useMemo(
        () => ({
            roomUsers,
            joinRoom,
            leaveRoom,
            setupPresenceHeartbeat,
            getCurrentRoomUserCount,
            updateUserOnlineStatus,
            onlineUsers,
            updateOnlineUsers,
        }),
        [
            roomUsers,
            joinRoom,
            leaveRoom,
            setupPresenceHeartbeat,
            getCurrentRoomUserCount,
            updateUserOnlineStatus,
            onlineUsers,
            updateOnlineUsers,
        ]
    );

    // 전체 값 통합
    const value = useMemo(
        () => ({
            ...messageValues,
            ...chatRoomValues,
            ...presenceValues,
        }),
        [messageValues, chatRoomValues, presenceValues]
    );

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
