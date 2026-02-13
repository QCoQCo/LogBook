import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    initAuthChannel,
    addAuthListener,
    migrateLocalToSession,
    sendAuthEvent,
} from '../utils/sessionSync';
import { forceRemoveUserFromAllRooms } from '../utils/chatService';
import apiClient from '../utils/apiClient';

// JWT payload에서 auth 클레임 추출 (예: "ROLE_ADMIN" -> "ADMIN")
const getRoleFromToken = (token) => {
    try {
        if (!token) return null;
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join(''),
        );
        const payload = JSON.parse(jsonPayload);
        const auth = payload.auth;
        if (!auth) return null;
        // Spring Security는 "ROLE_ADMIN", "ROLE_USER" 형태로 저장
        const role = auth.startsWith('ROLE_') ? auth.slice(5) : auth;
        return role === 'ADMIN' || role === 'USER' || role === 'GUEST' ? role : null;
    } catch (e) {
        return null;
    }
};

// 저장된 사용자 객체에 role이 없으면 JWT에서 채움 (관리자 로그인 시 토글 기본값 반영)
const ensureUserRole = (user) => {
    if (!user) return user;
    if (user.role != null && user.role !== '') return user;
    const roleFromToken = getRoleFromToken(user.token);
    return { ...user, role: roleFromToken ?? 'USER' };
};

// AuthContext 생성
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    // 로그인 사용자의 역할을 화면에서만 USER/ADMIN으로 전환 (테스트·데모용)
    const [roleOverride, setRoleOverride] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    const isTokenExpired = useCallback((token) => {
        try {
            if (!token) return true;
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    })
                    .join(''),
            );
            const payload = JSON.parse(jsonPayload);
            const now = Math.floor(Date.now() / 1000);
            return payload.exp ? payload.exp < now : true;
        } catch (e) {
            return true;
        }
    }, []);

    useEffect(() => {
        try {
            initAuthChannel();
        } catch (e) {}
        try {
            migrateLocalToSession();
        } catch (e) {}

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
                        setCurrentUser(ensureUserRole(parsed));
                    }
                } else {
                    setCurrentUser(null);
                }
            } catch (e) {
                setCurrentUser(null);
            }
            setIsAuthReady(true);
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
                } catch (e) {}
                return;
            }
            if (data.type === 'login') {
                try {
                    if (data.payload) {
                        const userWithRole = ensureUserRole(data.payload);
                        sessionStorage.setItem(
                            'logbook_current_user',
                            JSON.stringify(userWithRole),
                        );
                        setCurrentUser(userWithRole);
                    }
                } catch (e) {}
            }
            if (data.type === 'logout') {
                try {
                    sessionStorage.removeItem('logbook_current_user');
                    localStorage.removeItem('logbook_current_user'); // 동기화 보장
                } catch (e) {}
                setCurrentUser(null);
                setRoleOverride(null);
            }
        });

        return () => {
            try {
                unsub && unsub();
            } catch (e) {}
        };
    }, [isTokenExpired]);

    const login = useCallback((payload, persist = false) => {
        const userWithRole = ensureUserRole(payload);
        try {
            sessionStorage.setItem('logbook_current_user', JSON.stringify(userWithRole));
            if (persist) localStorage.setItem('logbook_current_user', JSON.stringify(userWithRole));
            setCurrentUser(userWithRole);
            sendAuthEvent('login', userWithRole);
        } catch (e) {
            setCurrentUser(userWithRole);
        }
    }, []);

    // 로그인한 사용자 정보 일부 갱신 (프로필 사진·닉네임 등 수정 후 헤더/모달 반영용)
    const updateCurrentUser = useCallback((updates) => {
        if (!updates || Object.keys(updates).length === 0) return;
        setCurrentUser((prev) => {
            if (!prev) return prev;
            const next = { ...prev, ...updates };
            try {
                sessionStorage.setItem('logbook_current_user', JSON.stringify(next));
                if (localStorage.getItem('logbook_current_user')) {
                    localStorage.setItem('logbook_current_user', JSON.stringify(next));
                }
                sendAuthEvent('login', next);
            } catch (e) {
                // ignore
            }
            return next;
        });
    }, []);

    /** 역할을 DB에 반영하고 새 토큰으로 갱신. (관리자만 성공, 비관리자는 403) */
    const updateRoleInBackend = useCallback(async (role) => {
        if (role !== 'USER' && role !== 'ADMIN') return;
        try {
            const { data } = await apiClient.patch('/users/me/role', { role });
            const payload = { ...data.user, token: data.token };
            try {
                sessionStorage.setItem('logbook_current_user', JSON.stringify(payload));
                if (localStorage.getItem('logbook_current_user')) {
                    localStorage.setItem('logbook_current_user', JSON.stringify(payload));
                }
                sendAuthEvent('login', payload);
            } catch (e) {
                // ignore
            }
            setCurrentUser(payload);
            setRoleOverride(null);
            return { ok: true };
        } catch (err) {
            if (err?.response?.status === 403) {
                setRoleOverride(role);
                return { ok: false, message: '역할 변경은 관리자만 가능합니다.' };
            }
            return {
                ok: false,
                message: err?.response?.data?.message || '역할 변경에 실패했습니다.',
            };
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
            setRoleOverride(null);
            sendAuthEvent('logout');
        } catch (e) {
            setCurrentUser(null);
        }
    }, [currentUser?.id]);

    // 실제 권한: 오버라이드가 있으면 그대로, 없으면 currentUser.role, 없으면 'USER'
    const effectiveRole = roleOverride ?? currentUser?.role ?? 'USER';

    const value = {
        currentUser,
        isLogin: !!currentUser,
        isAuthReady,
        effectiveRole,
        setRoleOverride,
        updateRoleInBackend,
        login,
        logout,
        updateCurrentUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
