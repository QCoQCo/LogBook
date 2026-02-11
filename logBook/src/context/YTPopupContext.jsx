import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Playlist Popup Context
const YTPopupContext = createContext(null);

let popupWindow = null;
let _lastInitPayload = null;
let _initOrigin = null;

function extractYouTubeID(url) {
    if (!url || typeof url !== 'string') return null;
    try {
        // try URL API to get 'v' param first
        const u = new URL(url, window.location.origin);
        const v = u.searchParams.get('v');
        if (v && v.length >= 10) return v.substr(0, 11);

        // youtu.be short link
        const byId = url.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
        if (byId && byId[1]) return byId[1];

        // embed or /v/ style
        const m = url.match(/(?:v=|\/embed\/|\/v\/|watch\?.*v=)([A-Za-z0-9_-]{11})/);
        if (m && m[1]) return m[1];

        // fallback: anything 11 chars in path/query
        const any = url.match(/([A-Za-z0-9_-]{11})/);
        return any ? any[1] : null;
    } catch (e) {
        // fallback to regex if URL constructor fails
        const m = url.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/)([A-Za-z0-9_-]{11})/);
        return m ? m[1] : null;
    }
}

export const YTPopupProvider = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(!!(popupWindow && !popupWindow.closed));

    const openYTPopup = useCallback((playlist = [], startIndex = 0, opts = {}) => {
        const MAX_DIM = 1000;
        var width = opts.width || 900;
        width = Math.min(MAX_DIM, width);
        var height =
            typeof opts.height === 'number' && opts.height > 0
                ? Math.min(MAX_DIM, opts.height)
                : Math.round((width * 9) / 16);
        const left = window.screenX + Math.max(0, (window.innerWidth - width) / 2);
        const top = window.screenY + Math.max(0, (window.innerHeight - height) / 2);

        const data = (playlist || []).map((p) => ({
            title: p.title || '',
            link: p.link || '',
            thumbnail: p.thumbnail || '',
            contentId: p.contentId || p.id || null,
            videoId: extractYouTubeID(p.link || ''),
        }));

        try {
            if (popupWindow && !popupWindow.closed) {
                try {
                    popupWindow.focus();
                } catch (e) {}
                try {
                    popupWindow.postMessage(
                        { cmd: 'append', items: data },
                        window.location.origin || '*'
                    );
                } catch (e) {
                    popupWindow.postMessage({ cmd: 'append', items: data }, '*');
                }
                try {
                    popupWindow.postMessage({ cmd: 'playLast' }, window.location.origin || '*');
                } catch (e) {
                    popupWindow.postMessage({ cmd: 'playLast' }, '*');
                }
                return popupWindow;
            }
        } catch (err) {
            popupWindow = null;
        }

        const w = window.open(
            '/html/playerPopup.html',
            'logbook_yt_popup',
            `width=${width},height=${height},left=${Math.floor(left)},top=${Math.floor(
                top
            )},resizable=yes`
        );
        if (!w) {
            alert('팝업이 차단되었습니다. 팝업을 허용해 주세요.');
            return null;
        }

        popupWindow = w;
        setIsPopupOpen(true);
        var tries = 0;
        var maxTries = 8;
        var initPayload = {
            cmd: 'init',
            items: data,
            startIndex: Number(startIndex) || 0,
            opts: opts || {},
        };
        var origin = window.location.origin || '*';
        _lastInitPayload = initPayload;
        _initOrigin = origin;

        var t = setInterval(function () {
            tries++;
            if (!popupWindow || popupWindow.closed) {
                popupWindow = null;
                clearInterval(t);
                return;
            }
            try {
                popupWindow.postMessage(initPayload, origin);
            } catch (e) {
                try {
                    popupWindow.postMessage(initPayload, '*');
                } catch (e) {}
            }
            if (tries >= maxTries) {
                clearInterval(t);
            }
        }, 400);

        try {
            popupWindow._initIntervalId = t;
            popupWindow._clearOnClose = !!(opts && opts.clearOnClose);
        } catch (e) {}

        return w;
    }, []);

    const playTrackInPopup = useCallback((index) => {
        if (popupWindow && !popupWindow.closed) {
            try {
                popupWindow.postMessage({ cmd: 'playIndex', index }, window.location.origin || '*');
                popupWindow.focus();
            } catch (e) {
                try {
                    popupWindow.postMessage({ cmd: 'playIndex', index }, '*');
                    popupWindow.focus();
                } catch (e) {}
            }
        }
    }, []);

    useEffect(() => {
        function onMsg(ev) {
            if (!popupWindow) return;
            if (ev.source !== popupWindow || !ev.data || !ev.data.cmd) return;

            switch (ev.data.cmd) {
                case 'init_ack':
                    try {
                        clearInterval(popupWindow._initIntervalId);
                        delete popupWindow._initIntervalId;
                    } catch (e) {}
                    break;
                case 'request_init':
                    if (_lastInitPayload) {
                        try {
                            popupWindow.postMessage(_lastInitPayload, _initOrigin || '*');
                        } catch (e) {
                            popupWindow.postMessage(_lastInitPayload, '*');
                        }
                    }
                    break;
                case 'nowPlaying':
                    if (typeof ev.data.index === 'number') {
                        setCurrentTrack(ev.data.index);
                    }
                    break;
            }
        }

        window.addEventListener('message', onMsg, false);

        const watchPopup = setInterval(() => {
            try {
                if (popupWindow && popupWindow.closed) {
                    if (popupWindow._clearOnClose) {
                        localStorage.removeItem('logbook_yt_playlist_v1');
                        localStorage.removeItem('logbook_yt_playlist_index_v1');
                    }
                    popupWindow = null;
                    setIsPopupOpen(false);
                } else if (!popupWindow) {
                    setIsPopupOpen(false);
                }
            } catch (e) {
                popupWindow = null;
                setIsPopupOpen(false);
            }
        }, 1000);

        return () => {
            window.removeEventListener('message', onMsg);
            clearInterval(watchPopup);
        };
    }, []);

    const value = { openYTPopup, playTrackInPopup, currentTrack, isPopupOpen };

    return <YTPopupContext.Provider value={value}>{children}</YTPopupContext.Provider>;
};

export const useYTPopup = () => {
    const context = useContext(YTPopupContext);
    if (!context) {
        throw new Error('useYTPopup must be used within a YTPopupProvider');
    }
    return context;
};
