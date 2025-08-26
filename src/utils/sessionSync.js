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
            console.debug('[sessionSync] sendAuthEvent via BC', msg);
        }
        // always write to localStorage as well to guarantee storage events across tabs
        const key = 'logbook_auth_event';
        try {
            localStorage.setItem(key, JSON.stringify(msg));
            // remove immediately to avoid leaving data (this still triggers storage events)
            localStorage.removeItem(key);
            console.debug('[sessionSync] sendAuthEvent via localStorage', msg);
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
            console.debug('[sessionSync] auth event received', data);
            handler(data);
        } catch (e) {
            // ignore
        }
    };

    const listeners = [];

    if (bc) {
        const onmsg = (ev) => wrapped(ev.data);
        bc.addEventListener('message', onmsg);
        listeners.push(() => bc.removeEventListener('message', onmsg));
    }

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
