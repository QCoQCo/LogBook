import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// PlaylistContext 생성
const PlaylistContext = createContext();

export const PlaylistProvider = ({ children }) => {
    // 플레이리스트 캐시 (userId => playlist array)
    const [playlistsByUser, setPlaylistsByUser] = useState({});

    const STORAGE_KEY_PREFIX = 'playlists_'; // 일관된 키 사용

    const fetchPlaylists = useCallback(async (userId) => {
        if (!userId) return [];
        try {
            const key = `${STORAGE_KEY_PREFIX}${userId}`;
            const raw = localStorage.getItem(key);
            let localLists = [];
            if (raw) {
                try {
                    localLists = JSON.parse(raw) || [];
                } catch (e) {
                    console.warn('invalid local playlist JSON, clearing', key);
                    localLists = [];
                }
            }

            // 서버에서 가져온 데이터 (public/data)
            let serverLists = [];
            try {
                const res = await fetch('/data/playlistData.json');
                if (res.ok) {
                    const all = await res.json();
                    serverLists = Array.isArray(all) ? all.filter((p) => p.userId === userId) : [];
                }
            } catch (e) {
                console.warn('failed to fetch server playlists', e);
            }

            // 병합: 같은 playId가 있으면 서버 항목을 기본으로 사용하되,
            // songs는 contentId 기준으로 dedupe (로컬 변경 반영하려면 로직 확장)
            const byId = {};
            serverLists.forEach((pl) => {
                byId[pl.playId] = { ...pl };
            });
            localLists.forEach((pl) => {
                if (!byId[pl.playId]) {
                    byId[pl.playId] = { ...pl };
                } else {
                    // merge songs dedupe by contentId, 서버항목 앞에 로컬 항목 추가하고 중복 제거
                    const mergedSongs = [...(pl.songs || []), ...(byId[pl.playId].songs || [])];
                    const seen = new Set();
                    byId[pl.playId].songs = mergedSongs.filter((s) => {
                        const id = s.contentId || `${s.link}:${s.SEQ}`;
                        if (seen.has(id)) return false;
                        seen.add(id);
                        return true;
                    });
                }
            });

            const merged = Object.values(byId);
            setPlaylistsByUser((prev) => ({ ...prev, [userId]: merged }));
            // persist unified result back to localStorage
            try {
                localStorage.setItem(key, JSON.stringify(merged));
            } catch (e) {}

            return merged;
        } catch (err) {
            console.error('fetchPlaylists(context) error', err);
            return [];
        }
    }, []);

    const getPlaylists = useCallback(
        (userId) => {
            return playlistsByUser[userId] || [];
        },
        [playlistsByUser]
    );

    const persistUserPlaylists = useCallback((userId, lists) => {
        try {
            const key = `playlists_${userId}`;
            localStorage.setItem(key, JSON.stringify(lists));
        } catch (e) {
            console.error('persistUserPlaylists error', e);
        }
    }, []);

    const savePlaylists = useCallback(
        (userId, lists) => {
            setPlaylistsByUser((prev) => {
                const next = { ...prev, [userId]: lists };
                return next;
            });
            persistUserPlaylists(userId, lists);
        },
        [persistUserPlaylists]
    );

    const addSong = useCallback(
        (userId, playId, song) => {
            const lists = playlistsByUser[userId] || [];
            const next = lists.map((pl) =>
                pl.playId === playId ? { ...pl, songs: [...(pl.songs || []), song] } : pl
            );
            savePlaylists(userId, next);
            return next;
        },
        [playlistsByUser, savePlaylists]
    );

    const updatePlaylistSongs = useCallback(
        (userId, playId, songs) => {
            const lists = playlistsByUser[userId] || [];
            const next = lists.map((pl) => (pl.playId === playId ? { ...pl, songs } : pl));
            savePlaylists(userId, next);
            return next;
        },
        [playlistsByUser, savePlaylists]
    );

    const deleteSong = useCallback(
        (userId, playId, contentId) => {
            const lists = playlistsByUser[userId] || [];
            const next = lists.map((pl) =>
                pl.playId === playId
                    ? { ...pl, songs: (pl.songs || []).filter((s) => s.contentId !== contentId) }
                    : pl
            );
            savePlaylists(userId, next);
            return next;
        },
        [playlistsByUser, savePlaylists]
    );

    const addPlaylist = useCallback(
        (userId, playlistObj) => {
            const lists = playlistsByUser[userId] || [];
            const next = [...lists, playlistObj];
            savePlaylists(userId, next);
            return next;
        },
        [playlistsByUser, savePlaylists]
    );

    const deletePlaylist = useCallback(
        (userId, playId) => {
            if (!userId || !playId) return [];
            const lists = playlistsByUser[userId] || [];
            const next = (lists || []).filter((pl) => String(pl.playId) !== String(playId));
            savePlaylists(userId, next);
            return next;
        },
        [playlistsByUser, savePlaylists]
    );

    const updatePlaylistTitle = useCallback(
        (userId, playId, title) => {
            const lists = playlistsByUser[userId] || [];
            const next = lists.map((pl) => (pl.playId === playId ? { ...pl, title } : pl));
            savePlaylists(userId, next);
            return next;
        },
        [playlistsByUser, savePlaylists]
    );

    const findUserIdByPlayId = useCallback(
        (playId) => {
            if (!playId) return null;
            // 1) 먼저 메모리 캐시 확인
            const entries = Object.entries(playlistsByUser || {});
            for (const [uid, lists] of entries) {
                if (!Array.isArray(lists)) continue;
                if (lists.some((pl) => String(pl.playId) === String(playId))) return uid;
            }

            // 2) 캐시에 없으면 로컬스토리지에서 찾아보기 (STORAGE_KEY_PREFIX 사용)
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) continue;
                    const uid = key.slice(STORAGE_KEY_PREFIX.length);
                    const raw = localStorage.getItem(key);
                    if (!raw) continue;
                    const lists = JSON.parse(raw);
                    if (
                        Array.isArray(lists) &&
                        lists.some((pl) => String(pl.playId) === String(playId))
                    ) {
                        // 발견되면 메모리 캐시에도 넣어두기
                        setPlaylistsByUser((prev) => ({ ...(prev || {}), [uid]: lists }));
                        return uid;
                    }
                }
            } catch (e) {
                // parsing 문제나 접근 오류 무시
            }

            return null;
        },
        [playlistsByUser, setPlaylistsByUser]
    );

    // 빠른 조회용 인덱 생성 함수 (여러번 조회할 때 사용)
    const buildPlayIdIndex = useCallback(() => {
        const idx = new Map();
        Object.entries(playlistsByUser || {}).forEach(([uid, lists]) => {
            (lists || []).forEach((pl) => {
                if (pl && pl.playId) idx.set(String(pl.playId), uid);
            });
        });
        return idx;
    }, [playlistsByUser]);

    // 플레이리스트 관련 값들
    const playlistValues = useMemo(
        () => ({
            fetchPlaylists,
            getPlaylists,
            playlistsByUser,
            addSong,
            updatePlaylistSongs,
            deleteSong,
            addPlaylist,
            deletePlaylist,
            updatePlaylistTitle,
            findUserIdByPlayId,
            buildPlayIdIndex,
        }),
        [
            fetchPlaylists,
            getPlaylists,
            playlistsByUser,
            addSong,
            updatePlaylistSongs,
            deleteSong,
            addPlaylist,
            deletePlaylist,
            updatePlaylistTitle,
            findUserIdByPlayId,
            buildPlayIdIndex,
        ]
    );

    return <PlaylistContext.Provider value={playlistValues}>{children}</PlaylistContext.Provider>;
};

export const usePlaylist = () => {
    const context = useContext(PlaylistContext);
    if (!context) {
        throw new Error('usePlaylist must be used within a PlaylistProvider');
    }
    return context;
};
