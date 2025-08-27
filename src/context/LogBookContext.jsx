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
    sendMessageToRoom,
    subscribeToRoomMessages,
    deleteMessageFromRoom,
    getChatRoomList,
    initializeChatRoom,
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
    // 채팅방 목록 로드
    const loadChatRoomList = useCallback(async () => {
        try {
            const rooms = await getChatRoomList();
            setChatRoomList(rooms);

            // 첫 번째 채팅방을 기본으로 선택 (한 번만)
            if (rooms.length > 0 && !currentChatRoom) {
                setCurrentChatRoom(rooms[0]);
            }
        } catch (err) {
            console.error('채팅방 목록 로드 오류:', err);
            setError('채팅방 목록을 불러오는데 실패했습니다.');
        }
    }, []); // currentChatRoom 의존성 제거

    // 채팅방 변경
    const switchChatRoom = useCallback(
        (chatRoom) => {
            if (currentChatRoom?.name === chatRoom.name) return;

            // 이전 구독 해제
            if (messagesUnsubscribe) {
                messagesUnsubscribe();
                setMessagesUnsubscribe(null);
            }

            // 새 채팅방 설정
            setCurrentChatRoom(chatRoom);
            setMessages([]);
            console.log(`채팅방 변경: ${chatRoom.name}`);
        },
        [currentChatRoom, messagesUnsubscribe]
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

                console.log(
                    '메시지 전송 완료:',
                    messageText,
                    '채팅방:',
                    currentChatRoom.name,
                    '포트:',
                    port
                );
            } catch (err) {
                setError('메시지 전송에 실패했습니다.');
                console.error('메시지 전송 오류:', err);
            } finally {
                setLoading(false);
            }
        },
        [currentChatRoom]
    );

    // 현재 채팅방의 실시간 메시지 구독
    const subscribeToCurrentRoomMessages = useCallback(() => {
        if (!currentChatRoom) return null;

        try {
            console.log(`채팅방 ${currentChatRoom.name} 메시지 구독 시작`);

            const unsubscribe = subscribeToRoomMessages(
                currentChatRoom.name,
                (messageList) => {
                    console.log(
                        `채팅방 ${currentChatRoom.name} 메시지 업데이트:`,
                        messageList.length,
                        '개'
                    );
                    setMessages(messageList);
                },
                (error) => {
                    // 권한 오류인 경우 빈 배열로 설정 (collection이 아직 없는 경우)
                    if (error.code === 'permission-denied') {
                        console.log(
                            `채팅방 ${currentChatRoom.name}의 collection이 아직 생성되지 않음`
                        );
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
    }, [currentChatRoom]);

    // 채팅방 목록 로드 (컴포넌트 마운트 시)
    useEffect(() => {
        loadChatRoomList();
    }, [loadChatRoomList]);

    // 현재 채팅방 변경 시 메시지 구독
    useEffect(() => {
        let unsubscribe = null;

        if (currentChatRoom) {
            console.log(`새로운 채팅방 구독 설정: ${currentChatRoom.name}`);

            // 이전 구독 해제
            if (messagesUnsubscribe) {
                try {
                    messagesUnsubscribe();
                    console.log('이전 구독 해제 완료');
                } catch (error) {
                    console.error('이전 구독 해제 오류:', error);
                }
            }

            // 새 채팅방 메시지 구독
            unsubscribe = subscribeToCurrentRoomMessages();
            setMessagesUnsubscribe(() => unsubscribe);
        } else {
            // 채팅방이 없는 경우 메시지 초기화
            setMessages([]);
        }

        // 컴포넌트 언마운트 또는 채팅방 변경 시 구독 해제
        return () => {
            if (unsubscribe) {
                try {
                    unsubscribe();
                    console.log('구독 정리 완료');
                } catch (error) {
                    console.error('구독 정리 오류:', error);
                }
            }
        };
    }, [currentChatRoom]); // subscribeToCurrentRoomMessages, messagesUnsubscribe 의존성 제거

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
                console.log('메시지 삭제 완료:', messageId, '채팅방:', currentChatRoom.name);
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
            console.log('닉네임 업데이트:', userId, newNickname);
            return true;
        } catch (err) {
            setError('닉네임 업데이트에 실패했습니다.');
            console.error('닉네임 업데이트 오류:', err);
            return false;
        }
    }, []);

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

        // 사용자 관련
        onlineUsers,
        updateOnlineUsers,
        updateUserNickname,

        // UI 상태
        isChatPage,
        setIsChatPage,
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
