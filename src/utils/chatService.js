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
 * @param {string} userId - 사용자 ID
 * @param {string} userName - 사용자 이름
 * @param {string} port - 포트 번호 (선택사항)
 * @returns {Promise<string>} - 생성된 메시지 ID
 */
export const sendMessageToRoom = async (roomName, messageText, userId, userName, port = null) => {
    try {
        const collectionName = getChatRoomCollectionName(roomName);

        const messageData = {
            text: messageText,
            userId: userId,
            userName: userName,
            roomName: roomName,
            port: port,
            timestamp: serverTimestamp(),
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
 * 채팅방 목록을 chatRoomData.json에서 가져오기
 * @returns {Promise<Array>} - 채팅방 목록
 */
export const getChatRoomList = async () => {
    try {
        const response = await fetch('/data/chatRoomData.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return data.chatRooms || [];
    } catch (error) {
        console.error('채팅방 목록 로딩 오류:', error);
        return [];
    }
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
 * 새 채팅방을 생성하고 chatRoomData.json에 추가
 * @param {Object} roomData - 채팅방 데이터
 * @returns {Promise<Object>} - 생성된 채팅방 데이터
 */
export const createChatRoom = async (roomData) => {
    try {
        // 현재 채팅방 목록 가져오기
        const currentRooms = await getChatRoomList();

        // 새 ID 생성 (기존 ID 중 최대값 + 1)
        const newId =
            currentRooms.length > 0 ? Math.max(...currentRooms.map((room) => room.id)) + 1 : 1;

        // 새 채팅방 데이터 생성
        const newRoom = {
            id: newId,
            name: roomData.name,
            admin: roomData.admin,
            userId: roomData.userId,
            description: roomData.description || '',
            capacity: roomData.capacity || 50,
            currentUsers: 0,
            isPrivate: roomData.isPrivate || false,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
        };

        return newRoom;
    } catch (error) {
        console.error('채팅방 생성 오류:', error);
        throw error;
    }
};

/**
 * 채팅방을 삭제하고 chatRoomData.json에서 제거
 * @param {number} roomId - 삭제할 채팅방 ID
 * @returns {Promise<void>}
 */
export const deleteChatRoom = async (roomId) => {
    try {
        // 실제 구현에서는 백엔드 API를 호출하여 JSON 파일을 업데이트해야 합니다.
        // 현재는 프론트엔드에서만 처리되므로 새로고침 시 복원됩니다.
    } catch (error) {
        console.error('채팅방 삭제 오류:', error);
        throw error;
    }
};

/**
 * 채팅방별 접속 유저 관리를 위한 함수들
 */

/**
 * 채팅방에 사용자 접속 등록 (더 강력한 presence 시스템)
 * @param {string} roomName - 채팅방 이름
 * @param {string} userId - 사용자 ID
 * @param {string} userName - 사용자 이름
 * @param {string} port - 포트 번호
 * @returns {Promise<void>}
 */
export const joinChatRoom = async (roomName, userId, userName, port = null) => {
    try {
        const presenceRef = doc(db, 'presence', `${roomName}_${userId}`);
        const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await setDoc(
            presenceRef,
            {
                roomName,
                userId,
                userName,
                port,
                sessionId, // 세션 고유 ID 추가
                joinedAt: serverTimestamp(),
                lastSeen: serverTimestamp(),
                isOnline: true,
                browserTab: document.visibilityState === 'visible',
            },
            { merge: true }
        ); // merge 옵션으로 기존 데이터 보존

        console.log(`사용자 ${userName}(${userId})이 채팅방 ${roomName}에 입장했습니다.`);
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
            console.log(`사용자 ${userId}이 채팅방 ${roomName}에서 퇴장했습니다.`);
        } else {
            console.log(`사용자 ${userId}의 presence 정보가 이미 없습니다.`);
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
 * 특정 채팅방의 접속 유저 목록을 실시간으로 구독
 * @param {string} roomName - 채팅방 이름
 * @param {function} onUsersUpdate - 유저 목록 업데이트 콜백
 * @param {function} onError - 에러 처리 콜백
 * @returns {function} - 구독 해제 함수
 */
export const subscribeToRoomUsers = (roomName, onUsersUpdate, onError) => {
    try {
        // 5분 이내에 활동한 사용자만 온라인으로 간주
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const usersQuery = query(collection(db, 'presence'), where('roomName', '==', roomName));

        const unsubscribe = onSnapshot(
            usersQuery,
            (snapshot) => {
                const now = new Date();
                const activeUsers = [];

                snapshot.forEach((doc) => {
                    const userData = doc.data();
                    const lastSeen = userData.lastSeen?.toDate() || new Date(0);

                    // 5분 이내에 활동하고 isOnline이 true인 사용자만 활성 사용자로 간주
                    if (now - lastSeen < 5 * 60 * 1000 && userData.isOnline) {
                        activeUsers.push({
                            id: userData.userId,
                            name: userData.userName,
                            port: userData.port,
                            joinedAt: userData.joinedAt,
                            lastSeen: userData.lastSeen,
                            sessionId: userData.sessionId,
                        });
                    }
                });

                // 콘솔에 현재 활성 사용자 수 로그
                console.log(`채팅방 ${roomName} 활성 사용자: ${activeUsers.length}명`);
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
        console.log(
            `사용자 ${userId}을 모든 채팅방에서 제거했습니다. (제거된 항목: ${batch.length}개)`
        );
    } catch (error) {
        console.error('사용자 강제 제거 오류:', error);
    }
};
