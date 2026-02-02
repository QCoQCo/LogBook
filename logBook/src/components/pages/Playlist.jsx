import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePlaylist, useYTPopup, useAuth, useBlog, useUserData } from '../../context';
import PlaylistItem from './PlaylistItem';

import ReactGridLayout from 'react-grid-layout';
import './Playlist.scss';

const Playlist = () => {
    const { openYTPopup, currentTrack } = useYTPopup();
    const { currentUser } = useAuth();
    const { setActiveTab } = useBlog();
    const {
        fetchPlaylists,
        getPlaylists,
        fetchPlaylistDetail,
        addSong: ctxAddSong,
        updatePlaylistSongs: ctxUpdatePlaylistSongs,
        deleteSong: ctxDeleteSong,
        updatePlaylistTitle: ctxUpdatePlaylistTitle,
        findUserIdByPlayId,
    } = usePlaylist();
    const { userData } = useUserData();

    const linkInputRef = useRef(null);
    const { playId } = useParams();
    const [localPlaylist, setLocalPlaylist] = useState(null);

    const playlistUserId = findUserIdByPlayId(playId) || localPlaylist?.userId || null;

    // 현재 접속 유저 식별 (useAuth가 최우선)
    const loginId = currentUser?.loginId || null;
    const userId = currentUser?.id || null;

    // 1. 진입 시 바로 단건 데이터 조회
    useEffect(() => {
        if (playId && typeof fetchPlaylistDetail === 'function') {
            fetchPlaylistDetail(playId)
                .then((data) => {
                    if (data) setLocalPlaylist(data);
                })
                .catch((e) => console.error('Direct fetch error:', e));
        }
    }, [playId, fetchPlaylistDetail]);

    // 2. 주인이 확인되면 전체 목록도 갱신 (선택사항)
    useEffect(() => {
        if (playlistUserId) {
            fetchPlaylists(playlistUserId).catch((e) => console.error(e));
        }
    }, [playlistUserId, fetchPlaylists]);

    const contextPlaylists = getPlaylists(playlistUserId) || [];
    const contextItem = Array.isArray(contextPlaylists) && contextPlaylists.find((p) => String(p.playId) === String(playId));
    const playlistItem = contextItem || localPlaylist;

    const songs = (playlistItem?.songs || [])
        .slice()
        .sort((a, b) => (Number(a.SEQ) || 0) - (Number(b.SEQ) || 0));

    const addSong = (pId, song) => {
        if (!loginId) return;
        const s = { ...song, SEQ: String(Date.now() % 1000000) };
        ctxAddSong(loginId, pId, s);
    };

    const updatePlaylistSongs = (pId, newSongs) => {
        if (!loginId || !isOwner) return;
        ctxUpdatePlaylistSongs(loginId, pId, newSongs);
    };

    const deletePlaylistSongs = (pId, contentId) => {
        if (!loginId || !isOwner) return;
        ctxDeleteSong(loginId, pId, contentId);
    };

    const [link, setLink] = useState('');
    const [title, setTitle] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState('');
    const [localTitle, setLocalTitle] = useState('');

    useEffect(() => {
        const t = playlistItem?.title || '';
        setLocalTitle(t);
        if (!isEditingTitle) setEditTitle(t);
    }, [playlistItem?.title, isEditingTitle]);

    const ownerId = playlistItem?.userId || playlistItem?.ownerId;
    const isOwner = Boolean(ownerId && userId && String(ownerId) === String(userId));

    const layout = songs?.map((item, idx) => ({
        i: item.contentId || idx.toString(),
        x: 0,
        y: idx,
        w: 12,
        h: 1,
    }));

    const handlePlayAll = (startIndex = 0) => {
        if (songs?.length > 0) {
            openYTPopup(songs, startIndex, { clearOnClose: true });
        }
    };

    const handlePlayItem = (index) => {
        const item = songs[index];
        if (!item) return;
        openYTPopup([item], 0, { clearOnClose: true });
    };

    const isYouTubeUrl = (value) => {
        try {
            const u = new URL(value);
            return /youtube.com|youtu.be/.test(u.hostname);
        } catch (e) {
            return false;
        }
    };

    const extractYouTubeId = (value) => {
        if (!value) return null;
        try {
            const u = new URL(value);
            const hn = u.hostname.replace('www.', '');
            if (hn === 'youtu.be') return u.pathname.replace(/^\//, '');
            if (/youtube.com$/.test(hn)) {
                const v = u.searchParams.get('v');
                if (v) return v;
                const m = u.pathname.match(/\/(embed|v|shorts)\/([^\/\?&]+)/);
                if (m) return m[2];
            }
        } catch (e) {
            const m = value.match(/(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
            if (m) return m[1];
        }
        return null;
    };

    const fetchYouTubeMeta = async (videoUrl) => {
        try {
            setLoading(true);
            setError('');
            const id = extractYouTubeId(videoUrl) || (typeof videoUrl === 'string' && /^[A-Za-z0-9_-]{6,}$/.test(videoUrl) ? videoUrl : null);
            if (!id) throw new Error('Invalid YouTube link or id');
            const normalized = `https://www.youtube.com/watch?v=${id}`;
            const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(normalized)}&format=json`;
            const res = await fetch(oembed);
            if (!res.ok) throw new Error('Failed to fetch oEmbed');
            const data = await res.json();
            setTitle(data.title || '');
            setThumbnail(data.thumbnail_url || '');
        } catch (err) {
            console.error('oEmbed error', err);
            setError('Failed to fetch YouTube metadata');
            setTitle(''); setThumbnail('');
        } finally {
            setLoading(false);
        }
    };

    const handleLinkChange = (e) => {
        const v = e.target.value;
        setLink(v); setError(''); setTitle(''); setThumbnail('');
        if (v && isYouTubeUrl(v)) fetchYouTubeMeta(v);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        const raw = (link || '').trim();
        if (!raw) return setError('Link is required');

        const vid = extractYouTubeId(raw);
        if (!vid) return setError('Invalid YouTube link');
        if (songs?.some((s) => extractYouTubeId(s.link || '') === vid)) return setError('This link is already in the playlist');
        if (!title) return setError('Waiting for YouTube metadata');

        const newSong = {
            contentId: `song${Date.now()}`,
            title: title.trim(),
            link: `https://www.youtube.com/watch?v=${vid}`,
            createAt: new Date().toISOString(),
            thumbnail: thumbnail || '',
        };
        addSong(playlistItem.playId, newSong);

        setLink(''); setTitle(''); setThumbnail('');
        linkInputRef.current?.focus();
    };

    const startEditTitle = () => { setEditTitle(localTitle || ''); setIsEditingTitle(true); setError(''); };
    const cancelEditTitle = () => { setEditTitle(localTitle || ''); setIsEditingTitle(false); setError(''); };
    const confirmEditTitle = () => {
        const newT = (editTitle || '').trim();
        if (!newT) return setError('Title cannot be empty');
        if (!isOwner) return setError('Permission denied');
        ctxUpdatePlaylistTitle(userId, playlistItem?.playId, newT);
        setLocalTitle(newT);
        setIsEditingTitle(false);
    };

    return (
        <div id='Playlist'>
            <div className='playlist-title'>
                <div className='playlist-title-left'>
                    {!isEditingTitle ? (
                        <div className='title-view'>
                            <div className='title-text'>{localTitle}</div>
                            <div className='title-actions'>
                                {isOwner && (
                                    <button type='button' className='title-edit-btn' onClick={startEditTitle}>
                                        <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z' stroke='currentColor' strokeWidth='1.5' /><path d='M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z' stroke='currentColor' strokeWidth='1.5' /></svg>
                                    </button>
                                )}
                                {songs.length > 0 && (
                                    <button type='button' className='title-play-all-btn' onClick={() => handlePlayAll(0)}>
                                        <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor' xmlns='http://www.w3.org/2000/svg'><path d='M8 5v14l11-7z' /></svg>
                                        <span>Play All</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className='title-edit'>
                            <input className='title-edit-input' type='text' value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            <div className='title-edit-btns'>
                                <button type='button' className='title-confirm-btn' onClick={confirmEditTitle}>
                                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M20 6L9 17l-5-5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' /></svg>
                                </button>
                                <button type='button' className='title-cancel-btn' onClick={cancelEditTitle}>
                                    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M18 6L6 18M6 6l12 12' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className='playlist-title-right'>
                    {playlistItem && (
                        <Link
                            to={`/blog?userId=${encodeURIComponent(
                                playlistItem?.ownerLoginId ||
                                userData.find(u => String(u.id) === String(playlistItem?.userId))?.userId ||
                                (isOwner ? currentUser?.loginId : '') ||
                                ''
                            )}`}
                            className='goto-blog-btn'
                            onClick={() => { try { setActiveTab(3); } catch (e) { } }}
                        >
                            블로그로 이동
                        </Link>
                    )}
                </div>
            </div>
            <div className='playlist-contents'>
                {songs.length > 0 ? (
                    <ReactGridLayout className='layout' layout={layout} cols={12} width={1150} rowHeight={70} margin={[0, 0]} isResizable={false} isDraggable={isOwner} draggableHandle={isOwner ? '.playlist-item-drag' : undefined} draggableAxis='y' onLayoutChange={(newLayout) => {
                        if (!isOwner) return;
                        const ordered = newLayout.slice().sort((a, b) => a.y - b.y).map((l) => l.i);
                        const newSongs = ordered.map((id, idx) => {
                            const s = songs.find((x) => (x.contentId || '') === id) || songs[idx];
                            return { ...s, SEQ: String(idx + 1) };
                        });
                        updatePlaylistSongs(playlistItem?.playId, newSongs);
                    }}>
                        {songs.map((item, idx) => (
                            <div key={item.contentId || idx.toString()}>
                                <PlaylistItem item={item} deletePlaylistSongs={deletePlaylistSongs} playId={playlistItem?.playId} index={idx} onPlay={() => handlePlayItem(idx)} isActive={currentTrack === idx} isOwner={isOwner} />
                            </div>
                        ))}
                    </ReactGridLayout>
                ) : (
                    <div className='no-playlist'>No Playlist Available</div>
                )}
            </div>
            {isOwner && (
                <div className='playlist-input'>
                    <form onSubmit={handleSubmit} className='playlist-form'>
                        <div className='input-pill'>
                            {thumbnail ? <img className='thumb-preview' src={thumbnail} alt='thumb' /> : <div className='thumb-placeholder' />}
                            <input className='link-input' type='text' placeholder='Paste YouTube link here (only YouTube)' value={link} onChange={handleLinkChange} ref={linkInputRef} />
                            <button className='add-btn' type='submit'><svg width='18' height='18' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M5 12h14M13 5l7 7-7 7' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' /></svg></button>
                        </div>
                        <div className='meta-row'>
                            {loading ? <div className='loading'>Loading metadata...</div> : title ? <div className='song-title'>{title}</div> : <div className='hint'>Title will appear here after entering a YouTube link</div>}
                            {error && <div className='error'>{error}</div>}
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Playlist;