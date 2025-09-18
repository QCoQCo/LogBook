import BlogPlaylistItem from './BlogPlaylistItem';
import React, { useEffect } from 'react';
import { useYTPopup, usePlaylist } from '../../context';

import './BlogPlaylist.scss';

const BlogPlaylist = ({ userId, isOwner }) => {
    const { openYTPopup } = useYTPopup();
    const {
        fetchPlaylists,
        getPlaylists,
        addPlaylist: ctxAddPlaylist,
        deletePlaylist: ctxDeletePlaylist,
    } = usePlaylist();

    // 마운트 시 또는 userId 변경 시 context에 데이터 로드 요청
    useEffect(() => {
        if (!userId) return;
        fetchPlaylists(userId).catch((e) => {
            console.error('fetchPlaylists error', e);
        });
    }, [userId, fetchPlaylists]);

    // context 캐시에서 바로 읽음
    const playlists = getPlaylists(userId) || [];

    const handlePlay = (playlist, startIndex = 0) => {
        const songsRaw = playlist?.songs;
        const songs = Array.isArray(songsRaw) ? songsRaw.filter(Boolean) : [];
        if (!songs.length) {
            alert('플레이리스트 목록이 비어있습니다.');
            return;
        }
        try {
            openYTPopup(songs, startIndex, { clearOnClose: true });
        } catch (e) {
            console.error('play error', e);
        }
    };

    const handleAddPlaylist = async () => {
        const newPlaylist = {
            playId: `play_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            userId: userId || null,
            title: 'new Playlist',
            description: '',
            songs: [],
        };
        if (typeof ctxAddPlaylist === 'function') {
            try {
                await ctxAddPlaylist(userId, newPlaylist);
                return;
            } catch (e) {
                console.error('ctxAddPlaylist error', e);
            }
        }
        // fallback: 없음 (context에서 처리되도록 권장)
    };

    const handleDelete = async (playId) => {
        if (!userId) return;
        if (typeof ctxDeletePlaylist === 'function') {
            try {
                await ctxDeletePlaylist(userId, playId);
                return;
            } catch (e) {
                console.error('ctxDeletePlaylist error', e);
            }
        }
        // fallback: 없음 (context에서 처리되도록 권장)
    };

    return (
        <div id='BlogPlaylist'>
            {playlists.length > 0 ? (
                playlists.map((playlist) => (
                    <BlogPlaylistItem
                        key={playlist.playId || playlist.id || playlist.SEQ}
                        playlist={playlist}
                        onPlay={() => handlePlay(playlist)}
                        onDelete={() =>
                            handleDelete(playlist.playId || playlist.id || playlist.SEQ)
                        }
                        isOwner={isOwner}
                    />
                ))
            ) : (
                <div className='noBlogPlaylist'></div>
            )}
            <div className='blog-playlist-new'>
                {isOwner && <button onClick={handleAddPlaylist}>+</button>}
            </div>
        </div>
    );
};

export default BlogPlaylist;
