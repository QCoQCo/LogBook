import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { connectNotificationWebSocket } from '../utils/notificationWebSocket';
import apiClient from '../utils/apiClient';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { isLogin } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const disconnectRef = useRef(null);

    const fetchNotifications = useCallback(async (page = 0, size = 20) => {
        if (!isLogin) return;
        setLoading(true);
        try {
            const { data } = await apiClient.get('/notifications', {
                params: { page, size },
            });
            const content = data?.content ?? [];
            const isFirst = page === 0;
            setNotifications((prev) => (isFirst ? content : [...prev, ...content]));
        } catch (err) {
            console.error('알림 목록 조회 실패:', err);
        } finally {
            setLoading(false);
        }
    }, [isLogin]);

    const fetchUnreadCount = useCallback(async () => {
        if (!isLogin) return;
        try {
            const { data } = await apiClient.get('/notifications/unread-count');
            setUnreadCount(data ?? 0);
        } catch (err) {
            console.error('미읽음 개수 조회 실패:', err);
        }
    }, [isLogin]);

    const markAsRead = useCallback(async (id) => {
        try {
            await apiClient.patch(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (err) {
            console.error('읽음 처리 실패:', err);
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await apiClient.patch('/notifications/read-all');
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
            );
            setUnreadCount(0);
        } catch (err) {
            console.error('전체 읽음 처리 실패:', err);
        }
    }, []);

    // 로그인 시 WebSocket 연결 + 초기 데이터 로드
    useEffect(() => {
        if (!isLogin) {
            disconnectRef.current?.();
            disconnectRef.current = null;
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetchNotifications(0);
        fetchUnreadCount();

        const disconnect = connectNotificationWebSocket(
            (payload) => {
                setNotifications((prev) => [payload, ...prev]);
                setUnreadCount((c) => c + 1);
            },
            () => {},
            () => {},
        );
        disconnectRef.current = disconnect;

        return () => {
            disconnectRef.current?.();
            disconnectRef.current = null;
        };
    }, [isLogin, fetchNotifications, fetchUnreadCount]);

    const value = {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return ctx;
};
