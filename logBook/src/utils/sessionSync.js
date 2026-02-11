// Utilities to migrate localStorage current-user into sessionStorage
// and to synchronize login/logout across tabs using BroadcastChannel
// with a localStorage fallback.

let bc = null;

export function migrateLocalToSession() {
    try {
        const sessionRaw = sessionStorage.getItem('logbook_current_user');
        if (!sessionRaw) {
            const raw = localStorage.getItem('logbook_current_user');
            if (raw) {
                sessionStorage.setItem('logbook_current_user', raw);
                // remove from localStorage to avoid stale long-term storage
                try {
                    localStorage.removeItem('logbook_current_user');
                } catch (e) {
                    // ignore
                }
                return true;
            }
        }
    } catch (e) {
        // ignore
    }
    return false;
}

export function initAuthChannel() {
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            bc = new BroadcastChannel('logbook-auth');
        }
    } catch (e) {
        bc = null;
    }
}

// send auth event: type = 'login' | 'logout', payload optional
export function sendAuthEvent(type, payload = null) {
    const msg = { type, payload, ts: Date.now() };
    try {
        if (bc) {
            bc.postMessage(msg);
        }

        // [중요] BroadcastChannel은 자기 자신(현재 탭)에게 메시지를 보내지 않으므로,
        // 현재 탭에서도 UI가 반응할 수 있도록 CustomEvent를 추가로 발송함.
        const localEvent = new CustomEvent('logbook-auth-local', { detail: msg });
        window.dispatchEvent(localEvent);

        // always write to localStorage as well to guarantee storage events across tabs
        const key = 'logbook_auth_event';
        try {
            localStorage.setItem(key, JSON.stringify(msg));
            localStorage.removeItem(key);
        } catch (e) {
            // ignore
        }
    } catch (e) {
        // ignore
    }
}

// add listener, returns unsubscribe function
export function addAuthListener(handler) {
    const wrapped = (data) => {
        try {
            handler(data);
        } catch (e) {
            // ignore
        }
    };

    const listeners = [];

    // 1. BroadcastChannel Listener (다른 탭 수신용)
    if (bc) {
        const onmsg = (ev) => wrapped(ev.data);
        bc.addEventListener('message', onmsg);
        listeners.push(() => bc.removeEventListener('message', onmsg));
    }

    // 2. CustomEvent Listener (현재 탭 수신용)
    const onLocal = (ev) => wrapped(ev.detail);
    window.addEventListener('logbook-auth-local', onLocal);
    listeners.push(() => window.removeEventListener('logbook-auth-local', onLocal));

    // 3. Storage Listener (BC 미지원 환경 및 탭 간 동기화 백업용)
    const onStorage = (ev) => {
        if (ev.key === 'logbook_auth_event' && ev.newValue) {
            try {
                const data = JSON.parse(ev.newValue);
                wrapped(data);
            } catch (e) {
                // ignore
            }
        }
    };
    window.addEventListener('storage', onStorage);
    listeners.push(() => window.removeEventListener('storage', onStorage));

    return () => {
        listeners.forEach((fn) => {
            try {
                fn();
            } catch (e) {
                // ignore
            }
        });
    };
}

export function closeAuthChannel() {
    try {
        if (bc) {
            bc.close();
            bc = null;
        }
    } catch (e) {
        // ignore
    }
}
