import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    initAuthChannel,
    addAuthListener,
    migrateLocalToSession,
    sendAuthEvent,
} from '../utils/sessionSync';
import { forceRemoveUserFromAllRooms } from '../utils/chatService';

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
                // console.log('로그아웃 시 모든 채팅방에서 퇴장 처리 완료');
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

    const value = {
        currentUser,
        isLogin: !!currentUser,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
