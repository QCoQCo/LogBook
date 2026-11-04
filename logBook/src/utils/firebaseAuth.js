import { signInWithCustomToken, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import apiClient from './apiClient';

// 서버가 확인한 Firebase 사용자 정보. 메시지 작성자 필드는 Firestore 규칙이 이 값과 비교한다.
let identity = null;
// 서버에 서비스 계정이 없으면(503) 다음 새로고침까지 다시 요청하지 않음
let tokenUnavailable = false;
// 로그인/로그아웃이 겹쳐도 순서대로 처리
let syncQueue = Promise.resolve();

const loadIdentity = async () => {
    const user = auth.currentUser;
    if (!user) {
        identity = null;
        return null;
    }
    const { claims } = await user.getIdTokenResult();
    identity = {
        userId: Number(user.uid),
        loginId: claims.loginId ?? null,
        nickName: claims.nickName ?? null,
    };
    return identity;
};

const runSync = async (user) => {
    await auth.authStateReady();

    if (!user) {
        identity = null;
        if (auth.currentUser) {
            await signOut(auth);
        }
        return;
    }

    if (auth.currentUser?.uid === String(user.id)) {
        const current = await loadIdentity();
        const isSameNickName = user.nickName == null || current.nickName === user.nickName;
        const isSameLoginId = user.loginId == null || current.loginId === user.loginId;
        if (isSameNickName && isSameLoginId) return;
    }

    if (tokenUnavailable) return;
    try {
        const { data } = await apiClient.post('/chat/firebase-token');
        await signInWithCustomToken(auth, data.token);
        await loadIdentity();
    } catch (error) {
        if (error.response?.status === 503) {
            tokenUnavailable = true;
        }
        throw error;
    }
};

/**
 * Firebase 로그인 상태를 LogBook 로그인 상태에 맞춘다.
 * @param {{id: number, loginId?: string, nickName?: string}|null} user - 로그인 사용자, 로그아웃이면 null
 * @returns {Promise<void>}
 */
export const syncFirebaseUser = (user) => {
    const task = syncQueue.catch(() => {}).then(() => runSync(user));
    syncQueue = task;
    return task;
};

/**
 * Firestore 쓰기 전에 호출. 해당 사용자로 Firebase 로그인이 끝나도록 보장한다.
 * 실패해도 던지지 않으며, 그 경우 Firestore 규칙이 판단한다.
 * @param {number|string} userId - DB 사용자 ID
 * @returns {Promise<Object|null>} - 서버가 확인한 사용자 정보
 */
export const ensureFirebaseUser = async (userId) => {
    await syncQueue.catch(() => {});
    try {
        if (auth.currentUser?.uid !== String(userId)) {
            await syncFirebaseUser({ id: userId });
        } else if (!identity) {
            await loadIdentity();
        }
    } catch (error) {
        console.warn('Firebase 로그인 오류:', error);
    }
    return auth.currentUser?.uid === String(userId) ? identity : null;
};

/**
 * 이미 Firebase에 로그인되어 있는지 확인 (로그인이 필요한 정리 작업용)
 * @returns {Promise<boolean>}
 */
export const isFirebaseSignedIn = async () => {
    await auth.authStateReady();
    await syncQueue.catch(() => {});
    return !!auth.currentUser;
};
