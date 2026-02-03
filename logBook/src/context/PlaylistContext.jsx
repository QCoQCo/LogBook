import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import * as playlistService from '../utils/playlistService';

const PlaylistContext = createContext();

export const PlaylistProvider = ({ children }) => {
    const [playlistsByUser, setPlaylistsByUser] = useState({});

    // 0. 유저 ID 찾기 (안정화: 숫자 ID 우선 검색하여 루프 방지)
    const findUserIdByPlayId = useCallback((playId) => {
        if (!playId) return null;
        const entries = Object.entries(playlistsByUser);
        // 1순위: 숫자(PK) 키에서 먼저 찾음
        for (const [uid, lists] of entries) {
            if (!isNaN(uid) && lists.some(pl => String(pl.playId) === String(playId))) return uid;
        }
        // 2순위: 그 외(아이디 등)에서 찾음
        for (const [uid, lists] of entries) {
            if (isNaN(uid) && lists.some(pl => String(pl.playId) === String(playId))) return uid;
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
                ownerLoginId: pl.ownerLoginId,
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
                const newState = { ...prev };
                const numericUid = pl.userId;
                const loginUid = pl.ownerLoginId;

                // 해당 유저의 모든 리스트에서 현재 항목 갱신
                const updateList = (uid) => {
                    if (!uid) return;
                    const existing = newState[uid] || [];
                    const idx = existing.findIndex((p) => String(p.playId) === String(pl.id));
                    let newList = idx >= 0 ? [...existing] : [...existing, mapped];
                    if (idx >= 0) newList[idx] = mapped;
                    newState[uid] = newList;
                };

                updateList(numericUid);
                updateList(loginUid);

                return newState;
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
    let isUpdatingOrder = false;
    const updatePlaylistSongs = useCallback(async (userId, playId, newSongs) => {
        if (isUpdatingOrder) return;
        isUpdatingOrder = true;

        // [낙관적 업데이트] 메모리 상태 즉시 반영
        setPlaylistsByUser((prev) => {
            const uid = userId || findUserIdByPlayId(playId);
            if (!uid) return prev;
            const existing = prev[uid] || [];
            const newList = existing.map(pl =>
                String(pl.playId) === String(playId) ? { ...pl, songs: newSongs } : pl
            );
            return { ...prev, [uid]: newList };
        });

        try {
            // [수정] 병렬(Promise.all) 대신 순차적 처리로 서버 부하 및 꼬임 방지
            for (let i = 0; i < newSongs.length; i++) {
                const song = newSongs[i];
                const itemData = {
                    title: song.title,
                    link: song.link,
                    thumbnail: song.thumbnail,
                    seq: i
                };
                await playlistService.updatePlaylistItem(song.contentId, itemData);
            }
            // 최종 정합성을 위해 백그라운드에서 리프레시
            await fetchPlaylists(userId);
            await fetchPlaylistDetail(playId);
        } catch (e) {
            console.error('updatePlaylistSongs error', e);
        } finally {
            isUpdatingOrder = false;
        }
    }, [fetchPlaylists, fetchPlaylistDetail, findUserIdByPlayId]);



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