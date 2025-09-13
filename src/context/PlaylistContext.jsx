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

    const updatePlaylistTitle = useCallback(
        (userId, playId, title) => {
            const lists = playlistsByUser[userId] || [];
            const next = lists.map((pl) => (pl.playId === playId ? { ...pl, title } : pl));
            savePlaylists(userId, next);
            return next;
        },
        [playlistsByUser, savePlaylists]
    );

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
            updatePlaylistTitle,
        }),
        [
            fetchPlaylists,
            getPlaylists,
            playlistsByUser,
            addSong,
            updatePlaylistSongs,
            deleteSong,
            addPlaylist,
            updatePlaylistTitle,
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
