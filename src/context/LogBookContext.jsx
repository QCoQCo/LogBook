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

// LogBookContext 생성
const LogBookContext = createContext();

// LogBookProvider 컴포넌트
export const LogBookProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    // 메시지 전송 함수
    const sendMessage = useCallback(async (messageText, userId, userName, port = null) => {
        try {
            setLoading(true);
            setError(null);

            // Firebase Firestore에 메시지 저장 (포트 정보 포함)
            await addDoc(collection(db, 'messages'), {
                text: messageText,
                userId: userId,
                userName: userName,
                port: port,
                timestamp: serverTimestamp(),
            });

            console.log('메시지 전송 완료:', messageText, '포트:', port);
        } catch (err) {
            setError('메시지 전송에 실패했습니다.');
            console.error('메시지 전송 오류:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 실시간 메시지 구독 함수
    const subscribeToMessages = useCallback(() => {
        try {
            // Firebase Firestore 실시간 리스너 설정
            const messagesQuery = query(
                collection(db, 'messages'),
                orderBy('timestamp', 'asc'),
                limit(100)
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
                    setMessages(messageList);
                },
                (err) => {
                    setError('메시지 로딩에 실패했습니다.');
                    console.error('메시지 구독 오류:', err);
                }
            );

            return unsubscribe;
        } catch (err) {
            setError('메시지 구독 설정에 실패했습니다.');
            console.error('메시지 구독 설정 오류:', err);
            return null;
        }
    }, []);

    // 컴포넌트 마운트 시 실시간 구독 시작
    useEffect(() => {
        const unsubscribe = subscribeToMessages();

        // 컴포넌트 언마운트 시 구독 해제
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [subscribeToMessages]);

    // 메시지 삭제 함수
    const deleteMessage = useCallback(async (messageId) => {
        try {
            setLoading(true);
            setError(null);

            await deleteDoc(doc(db, 'messages', messageId));
            console.log('메시지 삭제 완료:', messageId);
        } catch (err) {
            setError('메시지 삭제에 실패했습니다.');
            console.error('메시지 삭제 오류:', err);
        } finally {
            setLoading(false);
        }
    }, []);

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
        messages,
        loading,
        error,
        onlineUsers,
        sendMessage,
        deleteMessage,
        clearError,
        updateOnlineUsers,
        updateUserNickname,
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
