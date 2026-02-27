import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const getToken = () => {
    try {
        const raw =
            localStorage.getItem('logbook_current_user') ||
            sessionStorage.getItem('logbook_current_user');
        if (!raw) return null;
        const user = JSON.parse(raw);
        return user?.token ?? null;
    } catch {
        return null;
    }
};

const getWsUrl = () => {
    const base = import.meta.env.DEV
        ? `${window.location.protocol}//${window.location.host}`
        : window.location.origin;
    // Spring context-path가 /api 이므로 WebSocket 엔드포인트는 /api/ws
    return `${base}/api/ws`;
};

/**
 * 알림용 WebSocket 클라이언트 생성 및 연결
 * @param {function} onNotification - 새 알림 수신 시 콜백 (payload: NotificationResponseDto)
 * @param {function} onConnect - 연결 성공 시 콜백
 * @param {function} onDisconnect - 연결 끊김 시 콜백
 * @returns {function} disconnect 함수 (연결 해제용)
 */
export const connectNotificationWebSocket = (onNotification, onConnect, onDisconnect) => {
    const token = getToken();
    if (!token) {
        onDisconnect?.();
        return () => {};
    }

    const client = new Client({
        webSocketFactory: () => new SockJS(getWsUrl()),
        connectHeaders: {
            Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 3000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (msg) => {
            if (import.meta.env.DEV && msg.startsWith('<<<')) {
                // 수신 메시지만 간단히 로그 (선택)
            }
        },
    });

    client.onConnect = () => {
        client.subscribe('/user/queue/notifications', (message) => {
            try {
                const body = JSON.parse(message.body);
                onNotification?.(body);
            } catch (e) {
                console.error('알림 파싱 오류:', e);
            }
        });
        onConnect?.();
    };

    client.onStompError = (frame) => {
        console.warn('STOMP 에러:', frame.headers?.message || frame);
        onDisconnect?.();
    };

    client.onWebSocketClose = () => {
        onDisconnect?.();
    };

    client.activate();

    return () => {
        client.deactivate();
    };
};
