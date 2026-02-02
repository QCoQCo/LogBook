import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import * as playlistService from '../utils/playlistService';

const PlaylistContext = createContext();

export const PlaylistProvider = ({ children }) => {
    const [playlistsByUser, setPlaylistsByUser] = useState({});

    // 0. 유저 ID 찾기
    const findUserIdByPlayId = useCallback((playId) => {
        if (!playId) return null;
        for (const [uid, lists] of Object.entries(playlistsByUser)) {
            if (lists.some(pl => String(pl.playId) === String(playId))) return uid;
        }
        return null;
    }, [playlistsByUser]);

    // 1. 목록 조회
    const fetchPlaylists = useCallback(async (userId) => {
        if (!userId) return [];
        try {
            const serverLists = await playlistService.getMyPlaylists(userId);
            const mappedLists = serverLists.map(pl => ({
                playId: pl.id.toString(),
                userId: pl.userId,
                ownerLoginId: pl.ownerLoginId, // [추가]
                title: pl.title,
                songs: (pl.items || []).map(item => ({
                    contentId: item.id.toString(),
                    title: item.title,
                    link: item.link,
                    thumbnail: item.thumbnail,
                    SEQ: item.seq
                }))
            }));
            setPlaylistsByUser((prev) => {
                const newState = { ...prev, [userId]: mappedLists };
                // 만약 userId가 문자열(loginId)이고, 조회된 목록에 숫자 ID(PK)가 있다면 해당 PK 키로도 캐시를 갱신
                if (mappedLists.length > 0) {
                    const numericId = mappedLists[0].userId;
                    if (numericId && String(numericId) !== String(userId)) {
                        newState[numericId] = mappedLists;
                    }
                }
                return newState;
            });
            return mappedLists;
        } catch (err) {
            console.error('fetchPlaylists API error', err);
            return [];
        }
    }, []);

    // 2. 단건 상세 조회
    const fetchPlaylistDetail = useCallback(async (playId) => {
        if (!playId) return null;
        try {
            const pl = await playlistService.getPlaylistDetail(playId);
            const mapped = {
                playId: pl.id.toString(),
                userId: pl.userId,
                ownerLoginId: pl.ownerLoginId, // [추가]
                title: pl.title,
                songs: (pl.items || []).map((item) => ({
                    contentId: item.id.toString(),
                    title: item.title,
                    link: item.link,
                    thumbnail: item.thumbnail,
                    SEQ: item.seq,
                })),
            };
            setPlaylistsByUser((prev) => {
                const uid = pl.userId;
                const existing = prev[uid] || [];
                const idx = existing.findIndex((p) => String(p.playId) === String(pl.id));
                let newList = idx >= 0 ? [...existing] : [...existing, mapped];
                if (idx >= 0) newList[idx] = mapped;
                return { ...prev, [uid]: newList };
            });
            return mapped;
        } catch (err) {
            console.error('fetchPlaylistDetail error', err);
            return null;
        }
    }, []);

    const getPlaylists = useCallback((userId) => playlistsByUser[userId] || [], [playlistsByUser]);

    // 3. 노래 추가
    const addSong = useCallback(async (userId, playId, song) => {
        try {
            await playlistService.addPlaylistItem(playId, {
                title: song.title,
                link: song.link,
                thumbnail: song.thumbnail,
                seq: 999
            });
            await fetchPlaylists(userId);
        } catch (e) {
            console.error('addSong error', e);
        }
    }, [fetchPlaylists]);

    // 4. 노래 삭제
    const deleteSong = useCallback(async (userId, playId, contentId) => {
        try {
            await playlistService.deletePlaylistItem(contentId);
            await fetchPlaylists(userId);
        } catch (e) {
            console.error('deleteSong error', e);
        }
    }, [fetchPlaylists]);

    // 5. 플레이리스트 추가
    const addPlaylist = useCallback(async (userId, playlistObj) => {
        try {
            await playlistService.createPlaylist(playlistObj.title);
            await fetchPlaylists(userId);
        } catch (e) {
            console.error('addPlaylist error', e);
        }
    }, [fetchPlaylists]);

    // 6. 플레이리스트 삭제
    const deletePlaylist = useCallback(async (userId, playId) => {
        try {
            await playlistService.deletePlaylist(playId);
            await fetchPlaylists(userId);
        } catch (e) {
            console.error('deletePlaylist error', e);
        }
    }, [fetchPlaylists]);

    // 7. 플레이리스트 제목 수정
    const updatePlaylistTitle = useCallback(async (userId, playId, newTitle) => {
        try {
            // [낙관적 업데이트] 메모리 상태 즉시 반영
            setPlaylistsByUser((prev) => {
                const uid = userId || findUserIdByPlayId(playId);
                if (!uid) return prev;
                const existing = prev[uid] || [];
                const newList = existing.map(pl =>
                    String(pl.playId) === String(playId) ? { ...pl, title: newTitle } : pl
                );
                return { ...prev, [uid]: newList };
            });

            await playlistService.updatePlaylistTitle(playId, newTitle);
            await fetchPlaylists(userId);
            // 단건 상세 정보 캐시도 갱신
            await fetchPlaylistDetail(playId);
        } catch (e) {
            console.error('updatePlaylistTitle error', e);
        }
    }, [fetchPlaylists, fetchPlaylistDetail, findUserIdByPlayId]);

    // 8. 플레이리스트 아이템(노래) 정보 일체 업데이트 (순서 변경 및 개별 수정 대응)
    const updatePlaylistSongs = useCallback(async (userId, playId, newSongs) => {
        try {
            // 순서(seq)나 제목 등이 변경된 것들을 하나씩 PATCH 호출 (백엔드 효율을 고려해 루프)
            // 실제 프로젝트에서는 덤프를 한 번에 보내는 로직이 좋으나, 현재 백엔드 구조(개별 수정)에 맞춤
            const promises = newSongs.map((song, index) => {
                const itemData = {
                    title: song.title,
                    link: song.link,
                    thumbnail: song.thumbnail,
                    seq: index // SEQ 대신 index를 순서로 사용
                };
                return playlistService.updatePlaylistItem(song.contentId, itemData);
            });
            await Promise.all(promises);
            await fetchPlaylists(userId);
            await fetchPlaylistDetail(playId);
        } catch (e) {
            console.error('updatePlaylistSongs error', e);
        }
    }, [fetchPlaylists, fetchPlaylistDetail]);



    const playlistValues = useMemo(() => ({
        fetchPlaylists,
        getPlaylists,
        playlistsByUser,
        addSong,
        deleteSong,
        addPlaylist,
        deletePlaylist,
        updatePlaylistSongs,
        updatePlaylistTitle,
        findUserIdByPlayId,
        fetchPlaylistDetail
    }), [fetchPlaylists, getPlaylists, playlistsByUser, addSong, deleteSong, addPlaylist, deletePlaylist, updatePlaylistSongs, updatePlaylistTitle, findUserIdByPlayId, fetchPlaylistDetail]);

    return <PlaylistContext.Provider value={playlistValues}>{children}</PlaylistContext.Provider>;
};

export const usePlaylist = () => {
    const context = useContext(PlaylistContext);
    if (!context) throw new Error('usePlaylist must be used within a PlaylistProvider');
    return context;
};