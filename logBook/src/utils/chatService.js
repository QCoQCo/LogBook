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
    where,
    getDocs,
    setDoc,
    updateDoc,
    getDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import apiClient from './apiClient';

/**
 * 채팅방 이름을 sanitize하여 collection 이름으로 사용 가능하게 변환
 * @param {string} roomName - 원본 채팅방 이름
 * @returns {string} - sanitize된 collection 이름
 */
export const sanitizeRoomName = (roomName) => {
    // 특수문자 제거하고 공백을 언더스코어로 변경
    return roomName
        .replace(/[^a-zA-Z0-9가-힣\s]/g, '') // 특수문자 제거
        .replace(/\s+/g, '_') // 공백을 언더스코어로 변경
        .toLowerCase(); // 소문자로 변환
};

/**
 * 채팅방의 메시지 collection 이름 생성
 * @param {string} roomName - 채팅방 이름
 * @returns {string} - Firebase collection 이름
 */
export const getChatRoomCollectionName = (roomName) => {
    const sanitized = sanitizeRoomName(roomName);
    return `chatroom_${sanitized}_messages`;
};

/**
 * 특정 채팅방에 메시지 전송
 * @param {string} roomName - 채팅방 이름
 * @param {string} messageText - 메시지 내용
 * @param {string|number} userId - 사용자 ID (백엔드 id, DB PK)
 * @param {string} nickName - 사용자 닉네임 (백엔드 nickName과 동일)
 * @param {string} sessionId - 세션 ID (비로그인 사용자용, 선택사항)
 * @param {string} loginId - 로그인 ID (백엔드 loginId, 프로필 조회용)
 * @returns {Promise<string>} - 생성된 메시지 ID
 */
export const sendMessageToRoom = async (
    roomName,
    messageText,
    userId,
    nickName,
    sessionId = null,
    loginId = null
) => {
    try {
        const collectionName = getChatRoomCollectionName(roomName);

        const messageData = {
            text: messageText,
            userId: userId,
            nickName: nickName,
            roomName: roomName,
            sessionId: sessionId,
            timestamp: serverTimestamp(),
            ...(loginId != null && loginId !== '' && { loginId }),
        };

        const docRef = await addDoc(collection(db, collectionName), messageData);
        return docRef.id;
    } catch (error) {
        console.error('메시지 전송 오류:', error);
        throw error;
    }
};

/**
 * 특정 채팅방의 메시지들을 실시간으로 구독
 * @param {string} roomName - 채팅방 이름
 * @param {function} onMessagesUpdate - 메시지 업데이트 콜백 함수
 * @param {function} onError - 에러 처리 콜백 함수
 * @param {number} messageLimit - 가져올 메시지 개수 제한 (기본값: 100)
 * @returns {function} - 구독 해제 함수
 */
export const subscribeToRoomMessages = (
    roomName,
    onMessagesUpdate,
    onError,
    messageLimit = 100
) => {
    try {
        const collectionName = getChatRoomCollectionName(roomName);

        const messagesQuery = query(
            collection(db, collectionName),
            orderBy('timestamp', 'asc'),
            limit(messageLimit)
        );

        const unsubscribe = onSnapshot(
            messagesQuery,
            (snapshot) => {
                const messageList = [];
                snapshot.forEach((doc) => {
                    messageList.push({
                        id: doc.id,
                        ...doc.data(),
                    });
                });
                onMessagesUpdate(messageList);
            },
            (error) => {
                console.error(`채팅방 ${roomName} 메시지 구독 오류:`, error);

                // 특정 오류 유형에 따른 처리
                if (error.code === 'permission-denied') {
                    // 빈 메시지 배열로 초기화
                    onMessagesUpdate([]);
                } else if (error.code === 'unavailable') {
                    console.warn(`Firebase 서비스 일시적 불가. 재시도합니다.`);
                } else {
                    console.error(`알 수 없는 오류:`, error.code, error.message);
                }

                if (onError) onError(error);
            }
        );

        return unsubscribe;
    } catch (error) {
        console.error('메시지 구독 설정 오류:', error);
        if (onError) onError(error);
        return null;
    }
};

/**
 * 특정 채팅방에서 메시지 삭제
 * @param {string} roomName - 채팅방 이름
 * @param {string} messageId - 삭제할 메시지 ID
 * @returns {Promise<void>}
 */
export const deleteMessageFromRoom = async (roomName, messageId) => {
    try {
        const collectionName = getChatRoomCollectionName(roomName);
        await deleteDoc(doc(db, collectionName, messageId));
    } catch (error) {
        console.error('메시지 삭제 오류:', error);
        throw error;
    }
};

/**
 * 채팅방 목록 조회 (MySQL API). 채팅방 관리는 백엔드, 메시지는 Firebase.
 * @returns {Promise<Array>} - 채팅방 목록
 */
export const fetchChatRoomList = async () => {
    const { data } = await apiClient.get('/chat/chat-rooms');
    return data.chatRooms || [];
};

/**
 * 채팅방 생성 (MySQL API). 인증 필요.
 * @param {Object} roomData - { name, description?, capacity?, isPrivate?, password? }
 * @returns {Promise<Object>} - 생성된 채팅방 (id, name, admin, userId, ...)
 */
export const createChatRoomViaApi = async (roomData) => {
    const { data } = await apiClient.post('/chat/chat-rooms', {
        name: roomData.name?.trim() || '',
        description: roomData.description || '',
        capacity: roomData.capacity ?? 50,
        isPrivate: roomData.isPrivate || false,
        password: roomData.isPrivate ? roomData.password || '' : undefined,
    });
    return data;
};

/**
 * 채팅방 삭제 (MySQL API). 생성자만 가능.
 * @param {number} roomId - 삭제할 채팅방 ID
 */
export const deleteChatRoomViaApi = async (roomId) => {
    await apiClient.delete(`/chat/chat-rooms/${roomId}`);
};

/**
 * 비공개방 비밀번호 검증 (MySQL API).
 * @param {number} roomId - 채팅방 ID
 * @param {string} password - 입력 비밀번호
 * @returns {Promise<boolean>} - 일치 여부
 */
export const validateRoomPasswordViaApi = async (roomId, password) => {
    const { data } = await apiClient.post(`/chat/chat-rooms/${roomId}/validate-password`, {
        password: password || '',
    });
    return data.valid === true;
};

/**
 * 특정 채팅방의 메시지 개수 확인 (컬렉션 존재 여부 확인용)
 * @param {string} roomName - 채팅방 이름
 * @returns {Promise<number>} - 메시지 개수
 */
export const getRoomMessageCount = async (roomName) => {
    try {
        const collectionName = getChatRoomCollectionName(roomName);
        const messagesQuery = query(collection(db, collectionName), limit(1));
        const snapshot = await getDocs(messagesQuery);
        return snapshot.size;
    } catch (error) {
        console.error(`채팅방 ${roomName} 메시지 개수 확인 오류:`, error);
        return 0;
    }
};

/**
 * 채팅방에 첫 번째 메시지가 전송될 때 collection을 초기화
 * @param {string} roomName - 채팅방 이름
 * @returns {Promise<void>}
 */
export const initializeChatRoom = async (roomName) => {
    try {
        const messageCount = await getRoomMessageCount(roomName);
        if (messageCount === 0) {
            // 채팅방 초기화 준비 완료
        }
    } catch (error) {
        console.error(`채팅방 ${roomName} 초기화 오류:`, error);
        throw error;
    }
};

/**
 * 새 채팅방을 Firebase에 생성 (사용자 생성)
 * @param {Object} roomData - 채팅방 데이터
 * @returns {Promise<Object>} - 생성된 채팅방 데이터
 */
export const createChatRoom = async (roomData) => {
    try {
        const newRoom = {
            name: roomData.name,
            admin: roomData.admin,
            userId: roomData.userId,
            description: roomData.description || '',
            capacity: roomData.capacity || 50,
            currentUsers: 0,
            isPrivate: roomData.isPrivate || false,
            password: roomData.isPrivate ? roomData.password || '0000' : null, // 비공개방만 비밀번호 설정
            isSystem: false, // 🔑 사용자 생성 채팅방
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'chatRooms'), newRoom);

        return {
            id: docRef.id,
            ...newRoom,
        };
    } catch (error) {
        console.error('채팅방 생성 오류:', error);
        throw error;
    }
};

/**
 * 채팅방 비밀번호 검증
 * @param {Object} room - 채팅방 객체
 * @param {string} inputPassword - 입력된 비밀번호
 * @returns {boolean} - 비밀번호 일치 여부
 */
export const validateRoomPassword = (room, inputPassword) => {
    // 공개방은 비밀번호 검증 불필요
    if (!room.isPrivate) {
        return true;
    }

    // 비공개방은 비밀번호 검증 필요
    return room.password === inputPassword;
};

/**
 * 특정 채팅방의 모든 메시지 삭제
 * @param {string} roomName - 채팅방 이름
 * @returns {Promise<void>}
 */
export const deleteAllMessagesFromRoom = async (roomName) => {
    try {
        const collectionName = getChatRoomCollectionName(roomName);

        // 해당 채팅방의 모든 메시지 조회
        const messagesQuery = query(collection(db, collectionName));
        const snapshot = await getDocs(messagesQuery);

        // 배치 삭제를 위한 배열
        const batch = [];

        // 모든 메시지를 배치에 추가
        snapshot.forEach((doc) => {
            batch.push(deleteDoc(doc.ref));
        });

        // 배치 삭제 실행
        if (batch.length > 0) {
            await Promise.all(batch);
            // console.log(`채팅방 "${roomName}"의 ${batch.length}개 메시지가 삭제되었습니다.`);
        }
    } catch (error) {
        console.error(`채팅방 "${roomName}" 메시지 삭제 오류:`, error);
        throw error;
    }
};

/**
 * 특정 채팅방의 Firebase presence 데이터 정리 (MySQL에서 방 삭제 후 호출용)
 * @param {string} roomName - 채팅방 이름
 */
export const cleanupPresenceForRoom = async (roomName) => {
    try {
        const presenceQuery = query(collection(db, 'presence'), where('roomName', '==', roomName));
        const snapshot = await getDocs(presenceQuery);
        await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
    } catch (err) {
        console.warn('Presence 정리 오류:', err);
    }
};

/**
 * 채팅방별 접속 유저 관리를 위한 함수들
 */

/**
 * 채팅방에 사용자 접속 등록 (더 강력한 presence 시스템)
 * @param {string} roomName - 채팅방 이름
 * @param {string|number} userId - 사용자 ID (백엔드 id, DB PK)
 * @param {string} nickName - 사용자 닉네임 (백엔드 nickName과 동일)
 * @param {string} sessionId - 세션 ID (비로그인 사용자용, 선택사항)
 * @param {string} loginId - 로그인 ID (백엔드 loginId, 프로필 조회용)
 * @returns {Promise<void>}
 */
export const joinChatRoom = async (
    roomName,
    userId,
    nickName,
    sessionId = null,
    loginId = null
) => {
    try {
        const presenceRef = doc(db, 'presence', `${roomName}_${userId}`);
        const internalSessionId =
            sessionId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await setDoc(
            presenceRef,
            {
                roomName,
                userId,
                nickName,
                sessionId: internalSessionId, // 세션 ID 저장
                ...(loginId != null && loginId !== '' && { loginId }),
                joinedAt: serverTimestamp(),
                lastSeen: serverTimestamp(),
                isOnline: true,
                browserTab: document.visibilityState === 'visible',
            },
            { merge: true }
        ); // merge 옵션으로 기존 데이터 보존
    } catch (error) {
        console.error('채팅방 접속 등록 오류:', error);
        throw error;
    }
};

/**
 * 채팅방에서 사용자 접속 해제 (명시적 퇴장)
 * @param {string} roomName - 채팅방 이름
 * @param {string} userId - 사용자 ID
 * @returns {Promise<void>}
 */
export const leaveChatRoom = async (roomName, userId) => {
    try {
        const presenceRef = doc(db, 'presence', `${roomName}_${userId}`);

        // 문서가 존재하는지 먼저 확인
        const presenceDoc = await getDoc(presenceRef);
        if (presenceDoc.exists()) {
            await deleteDoc(presenceRef);

            // 퇴장 시 해당 채팅방의 오래된 오프라인 유저들도 정리
            setTimeout(() => {
                cleanupOfflinePresenceForRoom(roomName).catch(console.error);
            }, 1000); // 1초 후 정리
        } else {
        }
    } catch (error) {
        console.error('채팅방 접속 해제 오류:', error);
        // 퇴장 실패는 치명적이지 않으므로 에러를 던지지 않음
    }
};

/**
 * 사용자의 마지막 활동 시간 업데이트 (heartbeat)
 * @param {string} roomName - 채팅방 이름
 * @param {string} userId - 사용자 ID
 * @returns {Promise<void>}
 */
export const updateUserPresence = async (roomName, userId) => {
    try {
        const presenceRef = doc(db, 'presence', `${roomName}_${userId}`);
        const presenceDoc = await getDoc(presenceRef);

        if (presenceDoc.exists()) {
            await updateDoc(presenceRef, {
                lastSeen: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('사용자 활동 시간 업데이트 오류:', error);
        // heartbeat 실패는 치명적이지 않으므로 에러를 던지지 않음
    }
};

/**
 * 사용자의 온라인 상태를 즉시 변경 (탭 숨김/표시 시 사용)
 * @param {string} roomName - 채팅방 이름
 * @param {string} userId - 사용자 ID
 * @param {boolean} isOnline - 온라인 상태
 * @returns {Promise<void>}
 */
export const updateUserOnlineStatus = async (roomName, userId, isOnline) => {
    try {
        const presenceRef = doc(db, 'presence', `${roomName}_${userId}`);
        const presenceDoc = await getDoc(presenceRef);

        if (presenceDoc.exists()) {
            await updateDoc(presenceRef, {
                isOnline: isOnline,
                browserTab: document.visibilityState === 'visible',
                lastSeen: serverTimestamp(),
            });
        }
    } catch (error) {
        console.error('사용자 온라인 상태 업데이트 오류:', error);
    }
};

/**
 * 특정 채팅방의 접속 유저 목록을 실시간으로 구독
 * @param {string} roomName - 채팅방 이름
 * @param {function} onUsersUpdate - 유저 목록 업데이트 콜백
 * @param {function} onError - 에러 처리 콜백
 * @returns {function} - 구독 해제 함수
 */
export const subscribeToRoomUsers = (roomName, onUsersUpdate, onError) => {
    try {
        const usersQuery = query(collection(db, 'presence'), where('roomName', '==', roomName));

        const unsubscribe = onSnapshot(
            usersQuery,
            (snapshot) => {
                const activeUsers = [];

                snapshot.forEach((doc) => {
                    const userData = doc.data();
                    const now = new Date();
                    const lastSeen = userData.lastSeen?.toDate() || new Date(0);
                    const timeDiff = now - lastSeen;
                    const isRecentlyActive = timeDiff < 2 * 60 * 1000; // 2분 이내 활동

                    // 게스트 사용자(비로그인 사용자) 제외 - userId가 'guest_'로 시작하는 경우 (userId는 숫자 또는 문자열일 수 있음)
                    const userIdStr = userData.userId != null ? String(userData.userId) : '';
                    const isGuestUser = userIdStr.startsWith('guest_');

                    // isOnline 상태와 최근 활동 시간 둘 다 확인하고, 게스트 사용자는 제외
                    if (userData.isOnline === true && isRecentlyActive && !isGuestUser) {
                        activeUsers.push({
                            id: userData.userId,
                            nickName: userData.nickName ?? userData.userName ?? '',
                            loginId: userData.loginId ?? null,
                            sessionId: userData.sessionId,
                            joinedAt: userData.joinedAt,
                            lastSeen: userData.lastSeen,
                        });
                    }
                });

                onUsersUpdate(activeUsers);
            },
            (error) => {
                console.error(`채팅방 ${roomName} 유저 구독 오류:`, error);
                if (onError) onError(error);
            }
        );

        return unsubscribe;
    } catch (error) {
        console.error('채팅방 유저 구독 설정 오류:', error);
        if (onError) onError(error);
        return null;
    }
};

/**
 * 강제로 모든 채팅방에서 특정 사용자 제거
 * @param {string} userId - 사용자 ID
 * @returns {Promise<void>}
 */
export const forceRemoveUserFromAllRooms = async (userId) => {
    try {
        const presenceQuery = query(collection(db, 'presence'), where('userId', '==', userId));

        const snapshot = await getDocs(presenceQuery);
        const batch = [];

        snapshot.forEach((doc) => {
            batch.push(deleteDoc(doc.ref));
        });

        await Promise.all(batch);
    } catch (error) {
        console.error('사용자 강제 제거 오류:', error);
    }
};

/**
 * 만료된 presence 문서들을 정리하는 함수
 * @param {number} expireMinutes - 만료 시간 (분, 기본값: 5분)
 * @returns {Promise<number>} - 정리된 문서 수
 */
export const cleanupExpiredPresence = async (expireMinutes = 5) => {
    try {
        const expiredTime = new Date(Date.now() - expireMinutes * 60 * 1000);

        // 모든 presence 문서들을 조회 (인덱스 없이도 안전)
        const allPresenceQuery = query(collection(db, 'presence'));
        const snapshot = await getDocs(allPresenceQuery);
        const batch = [];

        // 클라이언트 측에서 만료 조건 필터링
        snapshot.forEach((doc) => {
            const userData = doc.data();
            const lastSeen = userData.lastSeen?.toDate() || new Date(0);

            // 만료 시간보다 오래된 문서만 삭제 대상에 추가
            if (lastSeen < expiredTime) {
                batch.push(deleteDoc(doc.ref));
            }
        });

        if (batch.length > 0) {
            await Promise.all(batch);
        }

        return batch.length;
    } catch (error) {
        console.error('만료된 presence 정리 오류:', error);
        return 0;
    }
};

/**
 * 오프라인 상태이면서 오래된 presence 문서들을 정리하는 함수 (인덱스 불필요 버전)
 * @param {number} expireMinutes - 만료 시간 (분, 기본값: 10분)
 * @returns {Promise<number>} - 정리된 문서 수
 */
export const cleanupOfflinePresence = async (expireMinutes = 10) => {
    try {
        const expiredTime = new Date(Date.now() - expireMinutes * 60 * 1000);

        // 먼저 오프라인 상태인 문서들을 조회
        const offlineQuery = query(collection(db, 'presence'), where('isOnline', '==', false));

        const snapshot = await getDocs(offlineQuery);
        const batch = [];

        // 클라이언트 측에서 lastSeen 조건 필터링
        snapshot.forEach((doc) => {
            const userData = doc.data();
            const lastSeen = userData.lastSeen?.toDate() || new Date(0);

            // 만료 시간보다 오래된 문서만 삭제 대상에 추가
            if (lastSeen < expiredTime) {
                batch.push(deleteDoc(doc.ref));
            }
        });

        if (batch.length > 0) {
            await Promise.all(batch);
        }

        return batch.length;
    } catch (error) {
        console.error('오프라인 presence 정리 오류:', error);
        return 0;
    }
};

/**
 * 특정 채팅방의 오프라인 유저들을 정리하는 함수 (이벤트 기반)
 * @param {string} roomName - 채팅방 이름
 * @param {number} expireMinutes - 만료 시간 (분, 기본값: 5분)
 * @returns {Promise<number>} - 정리된 문서 수
 */
export const cleanupOfflinePresenceForRoom = async (roomName, expireMinutes = 5) => {
    try {
        const expiredTime = new Date(Date.now() - expireMinutes * 60 * 1000);

        // 특정 채팅방의 오프라인 유저들만 조회
        const roomOfflineQuery = query(
            collection(db, 'presence'),
            where('roomName', '==', roomName),
            where('isOnline', '==', false)
        );

        const snapshot = await getDocs(roomOfflineQuery);
        const batch = [];

        // 클라이언트 측에서 lastSeen 조건 필터링
        snapshot.forEach((doc) => {
            const userData = doc.data();
            const lastSeen = userData.lastSeen?.toDate() || new Date(0);

            // 만료 시간보다 오래된 문서만 삭제 대상에 추가
            if (lastSeen < expiredTime) {
                batch.push(deleteDoc(doc.ref));
            }
        });

        if (batch.length > 0) {
            await Promise.all(batch);
        }

        return batch.length;
    } catch (error) {
        console.error(`채팅방 ${roomName} 오프라인 유저 정리 오류:`, error);
        return 0;
    }
};
