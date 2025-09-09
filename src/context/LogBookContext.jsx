import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
import { forceRemoveUserFromAllRooms } from '../utils/chatService';
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
    updateUserOnlineStatus,
    subscribeToRoomUsers,
    subscribeToChatRooms,
    initializeDefaultChatRooms,
    cleanupExpiredPresence,
    cleanupOfflinePresence,
    cleanupOfflinePresenceForRoom,
} from '../utils/chatService';

// LogBookContext 생성
const LogBookContext = createContext();

// 공통 유틸리티 함수들
const isGuestUser = (userId) => {
    return !userId || userId.startsWith('guest_');
};

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

// LogBookProvider 컴포넌트
export const LogBookProvider = ({ children }) => {
    const [isChatPage, setIsChatPage] = useState(false); //채팅페이지에서는 다크모드적용

    //헤더 로그인 모달
    const [showLogin, setShowLogin] = useState(false);
    const toggleLogin = () => setShowLogin((s) => !s);

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    // 사용자 데이터 관리
    const [userData, setUserData] = useState([]);
    const [userDataLoading, setUserDataLoading] = useState(false);
    const [userDataLoaded, setUserDataLoaded] = useState(false);

    // 채팅방 관련 상태
    const [currentChatRoom, setCurrentChatRoom] = useState(null);
    const [chatRoomList, setChatRoomList] = useState([]);
    const [messagesUnsubscribe, setMessagesUnsubscribe] = useState(null);

    // Blog GridLayout 관련 상태
    const [layout, setLayout] = useState([]);
    const [draggingItem, setDraggingItem] = useState(null);
    const [clickedItem, setClickedItem] = useState(null);
    const [elements, setElements] = useState([]);
    const [isBlogEditting, setIsBlogEditting] = useState(false);

    // 게시글 작성 관련 상태
    const [markdown, setMarkdown] = useState('');
    const [postTitle, setPostTitle] = useState('');

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

    // 사용자 데이터 로딩 함수
    const loadUserData = useCallback(async () => {
        if (userDataLoaded || userDataLoading) return; // 이미 로드되었거나 로딩 중이면 중복 실행 방지

        try {
            setUserDataLoading(true);
            const response = await fetch('/data/userData.json');
            if (!response.ok) {
                throw new Error('사용자 데이터 로딩 실패');
            }
            const users = await response.json();
            setUserData(users);
            setUserDataLoaded(true);
        } catch (error) {
            console.error('사용자 데이터 로드 실패:', error);
            setError('사용자 데이터 로딩에 실패했습니다.');
        } finally {
            setUserDataLoading(false);
        }
    }, [userDataLoaded, userDataLoading]);

    // 사용자 데이터를 Map으로 변환하여 검색 성능 향상
    const userDataMap = useMemo(() => {
        const map = new Map();
        userData.forEach((user) => {
            // userId로 인덱싱
            if (user.userId) {
                map.set(user.userId, user);
            }
            // nickName으로도 인덱싱 (중복 허용)
            if (user.nickName && !map.has(user.nickName)) {
                map.set(user.nickName, user);
            }
        });
        return map;
    }, [userData]);

    // userId 또는 userName으로 사용자 프로필 사진 가져오기 (성능 최적화)
    const getUserProfilePhoto = useCallback(
        (userId, userName) => {
            // 게스트 사용자인 경우 null 반환
            if (isGuestUser(userId)) {
                return null;
            }

            // Map을 사용하여 O(1) 검색
            const user = userDataMap.get(userId) || userDataMap.get(userName);
            return user?.profilePhoto || null;
        },
        [userDataMap]
    );

    // 사용자 정보 전체 가져오기 (성능 최적화)
    const getUserInfo = useCallback(
        (userId, userName) => {
            // 게스트 사용자인 경우 null 반환
            if (isGuestUser(userId)) {
                return null;
            }

            // Map을 사용하여 O(1) 검색
            return userDataMap.get(userId) || userDataMap.get(userName) || null;
        },
        [userDataMap]
    );

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

                    // 추가 보험: 모든 채팅방에서 해당 사용자 제거
                    await forceRemoveUserFromAllRooms(currentUserId);
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

    // 사용자 데이터 로드 (컴포넌트 마운트 시)
    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

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

    // 사용자 데이터 관련 값들
    const userDataValues = useMemo(
        () => ({
            userData,
            userDataLoading,
            userDataLoaded,
            loadUserData,
            getUserProfilePhoto,
            getUserInfo,
            onlineUsers,
            updateOnlineUsers,
            updateUserNickname,
        }),
        [
            userData,
            userDataLoading,
            userDataLoaded,
            loadUserData,
            getUserProfilePhoto,
            getUserInfo,
            onlineUsers,
            updateOnlineUsers,
            updateUserNickname,
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
        }),
        [
            roomUsers,
            joinRoom,
            leaveRoom,
            setupPresenceHeartbeat,
            getCurrentRoomUserCount,
            updateUserOnlineStatus,
        ]
    );

    // UI 상태 관련 값들
    const uiValues = useMemo(
        () => ({
            isChatPage,
            setIsChatPage,
            showLogin,
            toggleLogin,
        }),
        [isChatPage, setIsChatPage, showLogin, toggleLogin]
    );

    // Blog 상태 관련 값들
    const blogValues = useMemo(
        () => ({
            layout,
            setLayout,
            draggingItem,
            setDraggingItem,
            clickedItem,
            setClickedItem,
            elements,
            setElements,
            isBlogEditting,
            setIsBlogEditting,
        }),
        [
            layout,
            setLayout,
            draggingItem,
            setDraggingItem,
            clickedItem,
            setClickedItem,
            elements,
            setElements,
            isBlogEditting,
            setIsBlogEditting,
        ]
    );

    // 게시글 작성 관련 값들
    const postEditorValues = useMemo(
        () => ({
            markdown,
            setMarkdown,
            postTitle,
            setPostTitle,
        }),
        [markdown, setMarkdown, postTitle, setPostTitle]
    );
    // 전체 값 통합
    const value = useMemo(
        () => ({
            ...messageValues,
            ...chatRoomValues,
            ...userDataValues,
            ...presenceValues,
            ...uiValues,
            ...blogValues,
            ...postEditorValues,
        }),
        [
            messageValues,
            chatRoomValues,
            userDataValues,
            presenceValues,
            uiValues,
            blogValues,
            postEditorValues,
        ]
    );

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
            setCurrentUser(payload);
            sendAuthEvent('login', payload);
        } catch (e) {
            // 로그인 실패 시에도 사용자 상태는 설정
            setCurrentUser(payload);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            // 현재 사용자가 채팅방에 접속 중인 경우 퇴장 처리
            if (currentUser?.id) {
                await forceRemoveUserFromAllRooms(currentUser.id);
                console.log('로그아웃 시 모든 채팅방에서 퇴장 처리 완료');
            }
        } catch (error) {
            console.error('로그아웃 시 채팅방 퇴장 처리 오류:', error);
        }

        try {
            sessionStorage.removeItem('logbook_current_user');
            localStorage.removeItem('logbook_current_user');
            setCurrentUser(null);
            sendAuthEvent('logout');
        } catch (e) {
            // 로그아웃 실패 시에도 사용자 상태는 초기화
            setCurrentUser(null);
        }
    }, [currentUser?.id]);

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

// Playlist Popup Context
const YTPopupContext = createContext(null);

let popupWindow = null;
let _lastInitPayload = null;
let _initOrigin = null;

function extractYouTubeID(url) {
    if (!url || typeof url !== 'string') return null;
    try {
        // try URL API to get 'v' param first
        const u = new URL(url, window.location.origin);
        const v = u.searchParams.get('v');
        if (v && v.length >= 10) return v.substr(0, 11);

        // youtu.be short link
        const byId = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
        if (byId && byId[1]) return byId[1];

        // embed or /v/ style
        const m = url.match(/(?:v=|\/embed\/|\/v\/|watch\?.*v=)([A-Za-z0-9_-]{11})/);
        if (m && m[1]) return m[1];

        // fallback: anything 11 chars in path/query
        const any = url.match(/([A-Za-z0-9_-]{11})/);
        return any ? any[1] : null;
    } catch (e) {
        // fallback to regex if URL constructor fails
        const m = url.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/)([A-Za-z0-9_-]{11})/);
        return m ? m[1] : null;
    }
}

export const YTPopupProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(!!(popupWindow && !popupWindow.closed));

    const openYTPopup = useCallback((playlist = [], startIndex = 0, opts = {}) => {
        const MAX_DIM = 1000;
        var width = opts.width || 900;
        width = Math.min(MAX_DIM, width);
        var height =
            typeof opts.height === 'number' && opts.height > 0
                ? Math.min(MAX_DIM, opts.height)
                : Math.round((width * 9) / 16);
        const left = window.screenX + Math.max(0, (window.innerWidth - width) / 2);
        const top = window.screenY + Math.max(0, (window.innerHeight - height) / 2);

        const data = (playlist || []).map((p) => ({
            title: p.title || '',
            link: p.link || '',
            thumbnail: p.thumbnail || '',
            contentId: p.contentId || p.id || null,
            videoId: extractYouTubeID(p.link || ''),
        }));

        try {
            if (popupWindow && !popupWindow.closed) {
                try {
                    popupWindow.focus();
                } catch (e) {}
                try {
                    popupWindow.postMessage(
                        { cmd: 'append', items: data },
                        window.location.origin || '*'
                    );
                } catch (e) {
                    popupWindow.postMessage({ cmd: 'append', items: data }, '*');
                }
                try {
                    popupWindow.postMessage({ cmd: 'playLast' }, window.location.origin || '*');
                } catch (e) {
                    popupWindow.postMessage({ cmd: 'playLast' }, '*');
                }
                return popupWindow;
            }
        } catch (err) {
            popupWindow = null;
        }

        const w = window.open(
            '/html/playerPopup.html',
            'logbook_yt_popup',
            `width=${width},height=${height},left=${Math.floor(left)},top=${Math.floor(
                top
            )},resizable=yes`
        );
        if (!w) {
            alert('팝업이 차단되었습니다. 팝업을 허용해 주세요.');
            return null;
        }

        popupWindow = w;
        setIsPopupOpen(true);
        var tries = 0;
        var maxTries = 8;
        var initPayload = {
            cmd: 'init',
            items: data,
            startIndex: Number(startIndex) || 0,
            opts: opts || {},
        };
        var origin = window.location.origin || '*';
        _lastInitPayload = initPayload;
        _initOrigin = origin;

        var t = setInterval(function () {
            tries++;
            if (!popupWindow || popupWindow.closed) {
                popupWindow = null;
                clearInterval(t);
                return;
            }
            try {
                popupWindow.postMessage(initPayload, origin);
            } catch (e) {
                try {
                    popupWindow.postMessage(initPayload, '*');
                } catch (e) {}
            }
            if (tries >= maxTries) {
                clearInterval(t);
            }
        }, 400);

        try {
            popupWindow._initIntervalId = t;
            popupWindow._clearOnClose = !!(opts && opts.clearOnClose);
        } catch (e) {}

        return w;
    }, []);

    const playTrackInPopup = useCallback((index) => {
        if (popupWindow && !popupWindow.closed) {
            try {
                popupWindow.postMessage({ cmd: 'playIndex', index }, window.location.origin || '*');
                popupWindow.focus();
            } catch (e) {
                try {
                    popupWindow.postMessage({ cmd: 'playIndex', index }, '*');
                    popupWindow.focus();
                } catch (e) {}
            }
        }
    }, []);

    useEffect(() => {
        function onMsg(ev) {
            if (!popupWindow) return;
            if (ev.source !== popupWindow || !ev.data || !ev.data.cmd) return;

            switch (ev.data.cmd) {
                case 'init_ack':
                    try {
                        clearInterval(popupWindow._initIntervalId);
                        delete popupWindow._initIntervalId;
                    } catch (e) {}
                    break;
                case 'request_init':
                    if (_lastInitPayload) {
                        try {
                            popupWindow.postMessage(_lastInitPayload, _initOrigin || '*');
                        } catch (e) {
                            popupWindow.postMessage(_lastInitPayload, '*');
                        }
                    }
                    break;
                case 'nowPlaying':
                    if (typeof ev.data.index === 'number') {
                        setCurrentTrack(ev.data.index);
                    }
                    break;
            }
        }

        window.addEventListener('message', onMsg, false);

        const watchPopup = setInterval(() => {
            try {
                if (popupWindow && popupWindow.closed) {
                    if (popupWindow._clearOnClose) {
                        localStorage.removeItem('logbook_yt_playlist_v1');
                        localStorage.removeItem('logbook_yt_playlist_index_v1');
                    }
                    popupWindow = null;
                    setIsPopupOpen(false);
                } else if (!popupWindow) {
                    setIsPopupOpen(false);
                }
            } catch (e) {
                popupWindow = null;
                setIsPopupOpen(false);
            }
        }, 1000);

        return () => {
            window.removeEventListener('message', onMsg);
            clearInterval(watchPopup);
        };
    }, []);

    const value = { openYTPopup, playTrackInPopup, currentTrack, isPopupOpen };

    return <YTPopupContext.Provider value={value}>{children}</YTPopupContext.Provider>;
};

export const useYTPopup = () => {
    const context = useContext(YTPopupContext);
    if (!context) {
        throw new Error('useYTPopup must be used within a YTPopupProvider');
    }
    return context;
};
