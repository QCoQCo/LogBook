import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    collection,
    addDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    limit,
    deleteDoc,
    doc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
    initAuthChannel,
    addAuthListener,
    migrateLocalToSession,
    sendAuthEvent,
} from '../utils/sessionSync';
import {
    sendMessageToRoom,
    subscribeToRoomMessages,
    deleteMessageFromRoom,
    getChatRoomList,
    initializeChatRoom,
    createChatRoom as createChatRoomService,
    deleteChatRoom as deleteChatRoomService,
    joinChatRoom,
    leaveChatRoom,
    updateUserPresence,
    subscribeToRoomUsers,
    forceRemoveUserFromAllRooms,
} from '../utils/chatService';

// LogBookContext 생성
const LogBookContext = createContext();

// LogBookProvider 컴포넌트
export const LogBookProvider = ({ children }) => {
    const [isChatPage, setIsChatPage] = useState(false); //채팅페이지에서는 다크모드적용

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    // 채팅방 관련 상태
    const [currentChatRoom, setCurrentChatRoom] = useState(null);
    const [chatRoomList, setChatRoomList] = useState([]);
    const [messagesUnsubscribe, setMessagesUnsubscribe] = useState(null);

    // Blog GridLayout 관련 상태
    const [draggingItem, setDraggingItem] = useState(null);
    const [clickedItem, setClickedItem] = useState(null);
    const [elements, setElements] = useState([]);

    // 실시간 접속 유저 관리
    const [roomUsers, setRoomUsers] = useState({});
    const [usersUnsubscribe, setUsersUnsubscribe] = useState(null);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [presenceHeartbeat, setPresenceHeartbeat] = useState(null);

    // 채팅방 목록 로드
    const loadChatRoomList = useCallback(async () => {
        try {
            const rooms = await getChatRoomList();
            setChatRoomList(rooms);

            // 기본 채팅방 선택 (일반 채팅방 우선)
            if (rooms.length > 0 && !currentChatRoom) {
                const defaultRoom = rooms.find((room) => room.name === '일반 채팅방') || rooms[0];
                setCurrentChatRoom(defaultRoom);
            }
        } catch (err) {
            console.error('채팅방 목록 로드 오류:', err);
            setError('채팅방 목록을 불러오는데 실패했습니다.');
        }
    }, []); // currentChatRoom 의존성 제거

    // 채팅방 변경 (강력한 퇴장 처리 포함)
    const switchChatRoom = useCallback(
        async (chatRoom) => {
            if (currentChatRoom?.name === chatRoom.name) return;

            try {
                // 이전 채팅방에서 강제 퇴장 처리
                if (currentChatRoom && currentUserId) {
                    console.log(`이전 채팅방 ${currentChatRoom.name}에서 퇴장 처리 중...`);
                    await leaveChatRoom(currentChatRoom.name, currentUserId);

                    // 추가 보험: 모든 채팅방에서 해당 사용자 제거
                    await forceRemoveUserFromAllRooms(currentUserId);
                }

                // 이전 구독 해제
                if (messagesUnsubscribe) {
                    messagesUnsubscribe();
                    setMessagesUnsubscribe(null);
                }

                // 이전 유저 구독 해제
                if (usersUnsubscribe) {
                    usersUnsubscribe();
                    setUsersUnsubscribe(null);
                }

                // 새 채팅방 설정
                setCurrentChatRoom(chatRoom);
                setMessages([]);

                console.log(`새 채팅방 ${chatRoom.name}으로 변경 완료`);
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

            try {
                setLoading(true);
                setError(null);

                // 채팅방별 메시지 전송
                await sendMessageToRoom(currentChatRoom.name, messageText, userId, userName, port);
            } catch (err) {
                const errorMessage = `메시지 전송에 실패했습니다: ${err.message}`;
                setError(errorMessage);
                console.error('메시지 전송 오류:', err);
                console.error('Firebase 설정:', {
                    currentChatRoom,
                    messageText,
                    userId,
                    userName,
                    port,
                });
            } finally {
                setLoading(false);
            }
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
            if (messagesUnsubscribe) {
                try {
                    messagesUnsubscribe();
                } catch (error) {
                    console.error('이전 메시지 구독 해제 오류:', error);
                }
            }

            if (usersUnsubscribe) {
                try {
                    usersUnsubscribe();
                } catch (error) {
                    console.error('이전 유저 구독 해제 오류:', error);
                }
            }

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
            if (messageUnsubscribe) {
                try {
                    messageUnsubscribe();
                } catch (error) {
                    console.error('메시지 구독 정리 오류:', error);
                }
            }
            if (userUnsubscribe) {
                try {
                    userUnsubscribe();
                } catch (error) {
                    console.error('유저 구독 정리 오류:', error);
                }
            }
        };
    }, [currentChatRoom]); // subscribeToCurrentRoomMessages, subscribeToCurrentRoomUsers 의존성 제거

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

    // 메시지 삭제 함수 (채팅방별)
    const deleteMessage = useCallback(
        async (messageId) => {
            if (!currentChatRoom) {
                setError('채팅방이 선택되지 않았습니다.');
                return;
            }

            try {
                setLoading(true);
                setError(null);

                await deleteMessageFromRoom(currentChatRoom.name, messageId);
            } catch (err) {
                setError('메시지 삭제에 실패했습니다.');
                console.error('메시지 삭제 오류:', err);
            } finally {
                setLoading(false);
            }
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

    // 사용자 닉네임 업데이트 함수
    const updateUserNickname = useCallback((userId, newNickname) => {
        try {
            // 여기에서는 로컬 상태 업데이트만 처리
            // 실제 데이터베이스 업데이트는 ChatPage에서 처리
            return true;
        } catch (err) {
            setError('닉네임 업데이트에 실패했습니다.');
            console.error('닉네임 업데이트 오류:', err);
            return false;
        }
    }, []);

    // 채팅방 생성 함수
    const createChatRoom = useCallback(async (roomData) => {
        try {
            setLoading(true);
            setError(null);

            const newRoom = await createChatRoomService(roomData);

            // 현재 목록에 새 채팅방 추가
            setChatRoomList((prevRooms) => [...prevRooms, newRoom]);

            return newRoom;
        } catch (err) {
            const errorMessage = '채팅방 생성에 실패했습니다.';
            setError(errorMessage);
            console.error('채팅방 생성 오류:', err);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    // 채팅방 삭제 함수
    const deleteChatRoom = useCallback(
        async (roomId) => {
            try {
                setLoading(true);
                setError(null);

                await deleteChatRoomService(roomId);

                // 현재 목록에서 채팅방 제거
                setChatRoomList((prevRooms) => prevRooms.filter((room) => room.id !== roomId));

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
                const errorMessage = '채팅방 삭제에 실패했습니다.';
                setError(errorMessage);
                console.error('채팅방 삭제 오류:', err);
                throw new Error(errorMessage);
            } finally {
                setLoading(false);
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

    // heartbeat 설정
    const setupPresenceHeartbeat = useCallback(
        (roomName, userId) => {
            // 기존 heartbeat 정리
            if (presenceHeartbeat) {
                clearInterval(presenceHeartbeat);
            }

            // 30초마다 presence 업데이트
            const interval = setInterval(async () => {
                try {
                    await updateUserPresence(roomName, userId);
                } catch (error) {
                    console.error('Presence heartbeat 오류:', error);
                }
            }, 30000); // 30초로 복원

            setPresenceHeartbeat(interval);
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
                    setRoomUsers((prev) => ({
                        ...prev,
                        [roomName]: users,
                    }));
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

    const value = {
        // 메시지 관련
        messages,
        loading,
        error,
        sendMessage,
        deleteMessage,
        clearError,

        // 채팅방 관련
        currentChatRoom,
        chatRoomList,
        switchChatRoom,
        loadChatRoomList,
        createChatRoom,
        deleteChatRoom,

        // 사용자 관련
        onlineUsers,
        updateOnlineUsers,
        updateUserNickname,

        // 실시간 접속 유저 관련
        roomUsers,
        joinRoom,
        leaveRoom,
        setupPresenceHeartbeat,
        getCurrentRoomUserCount,

        // UI 상태
        isChatPage,
        setIsChatPage,

        // Blog 상태
        draggingItem,
        setDraggingItem,
        clickedItem,
        setClickedItem,
        elements,
        setElements,
    };

    return <LogBookContext.Provider value={value}>{children}</LogBookContext.Provider>;
};

export const useLogBook = () => {
    const context = useContext(LogBookContext);
    if (!context) {
        throw new Error('useLogBook must be used within a LogBookProvider');
    }
    return context;
};

// AuthContext 생성
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        try {
            initAuthChannel();
        } catch (e) {}
        try {
            migrateLocalToSession();
        } catch (e) {}

        try {
            const raw =
                sessionStorage.getItem('logbook_current_user') ||
                localStorage.getItem('logbook_current_user');
            setCurrentUser(raw ? JSON.parse(raw) : null);
        } catch (e) {
            setCurrentUser(null);
        }

        const unsub = addAuthListener((data) => {
            if (!data || !data.type) return;
            if (data.type === 'request') {
                // respond with login payload if available
                try {
                    const raw =
                        sessionStorage.getItem('logbook_current_user') ||
                        localStorage.getItem('logbook_current_user');
                    if (raw) {
                        const payload = JSON.parse(raw);
                        sendAuthEvent('login', payload);
                    }
                } catch (e) {
                    // ignore
                }
                return;
            }
            if (data.type === 'login') {
                try {
                    if (data.payload) {
                        try {
                            sessionStorage.setItem(
                                'logbook_current_user',
                                JSON.stringify(data.payload)
                            );
                        } catch (e) {}
                        setCurrentUser(data.payload);
                    } else {
                        const raw =
                            sessionStorage.getItem('logbook_current_user') ||
                            localStorage.getItem('logbook_current_user');
                        setCurrentUser(raw ? JSON.parse(raw) : null);
                    }
                } catch (e) {
                    // ignore
                }
            }
            if (data.type === 'logout') {
                try {
                    sessionStorage.removeItem('logbook_current_user');
                } catch (e) {}
                setCurrentUser(null);
            }
        });

        return () => {
            try {
                unsub && unsub();
            } catch (e) {}
        };
    }, []);

    const login = useCallback((payload, persist = false) => {
        try {
            sessionStorage.setItem('logbook_current_user', JSON.stringify(payload));
            if (persist) localStorage.setItem('logbook_current_user', JSON.stringify(payload));
        } catch (e) {}
        setCurrentUser(payload);
        try {
            sendAuthEvent('login', payload);
        } catch (e) {}
    }, []);

    const logout = useCallback(() => {
        try {
            sessionStorage.removeItem('logbook_current_user');
            localStorage.removeItem('logbook_current_user');
        } catch (e) {}
        setCurrentUser(null);
        try {
            sendAuthEvent('logout');
        } catch (e) {}
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, isLogin: !!currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
