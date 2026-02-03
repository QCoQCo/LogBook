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

    const isTokenExpired = useCallback((token) => {
        try {
            if (!token) return true;
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            const now = Math.floor(Date.now() / 1000);
            return payload.exp ? payload.exp < now : true;
        } catch (e) {
            return true;
        }
    }, []);

    useEffect(() => {
        try {
            initAuthChannel();
        } catch (e) { }
        try {
            migrateLocalToSession();
        } catch (e) { }

        const initializeUser = () => {
            try {
                const raw =
                    sessionStorage.getItem('logbook_current_user') ||
                    localStorage.getItem('logbook_current_user');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed.token && isTokenExpired(parsed.token)) {
                        // 만료된 토큰 발견 시 즉시 정리
                        sessionStorage.removeItem('logbook_current_user');
                        localStorage.removeItem('logbook_current_user');
                        setCurrentUser(null);
                    } else {
                        setCurrentUser(parsed);
                    }
                } else {
                    setCurrentUser(null);
                }
            } catch (e) {
                setCurrentUser(null);
            }
        };

        initializeUser();

        const unsub = addAuthListener((data) => {
            if (!data || !data.type) return;
            if (data.type === 'request') {
                try {
                    const raw =
                        sessionStorage.getItem('logbook_current_user') ||
                        localStorage.getItem('logbook_current_user');
                    if (raw) {
                        const payload = JSON.parse(raw);
                        sendAuthEvent('login', payload);
                    }
                } catch (e) { }
                return;
            }
            if (data.type === 'login') {
                try {
                    if (data.payload) {
                        sessionStorage.setItem(
                            'logbook_current_user',
                            JSON.stringify(data.payload)
                        );
                        setCurrentUser(data.payload);
                    }
                } catch (e) { }
            }
            if (data.type === 'logout') {
                try {
                    sessionStorage.removeItem('logbook_current_user');
                    localStorage.removeItem('logbook_current_user'); // 동기화 보장
                } catch (e) { }
                setCurrentUser(null);
            }
        });

        return () => {
            try {
                unsub && unsub();
            } catch (e) { }
        };
    }, [isTokenExpired]);

    const login = useCallback((payload, persist = false) => {
        try {
            sessionStorage.setItem('logbook_current_user', JSON.stringify(payload));
            if (persist) localStorage.setItem('logbook_current_user', JSON.stringify(payload));
            setCurrentUser(payload);
            sendAuthEvent('login', payload);
        } catch (e) {
            setCurrentUser(payload);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            if (currentUser?.id) {
                await forceRemoveUserFromAllRooms(currentUser.id);
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
