import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PlaylistItem from './PlaylistItem';

import ReactGridLayout from 'react-grid-layout';
import './Playlist.scss';

const Playlist = ({
    playlist,
    addSong,
    updatePlaylistSongs,
    deletePlaylistSongs,
    updatePlaylistTitle,
}) => {
    const linkInputRef = useRef(null);
    const { playId } = useParams();

    const pl = (Array.isArray(playlist) && playlist.find((p) => p.playId === playId)) ||
        playlist[0] || { songs: [], title: '' };
    const songs = (pl.songs || [])
        .slice()
        .sort((a, b) => (Number(a.SEQ) || 0) - (Number(b.SEQ) || 0));

    const layout = songs.map((item, idx) => ({
        i: item.contentId || idx.toString(),
        x: 0,
        y: idx,
        w: 12,
        h: 1,
    }));

    // minimal form state and handler (keeps existing layout/structure)
    const [link, setLink] = useState('');
    const [title, setTitle] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // playlist title edit state
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState(pl.title || '');
    const [localTitle, setLocalTitle] = useState(pl.title || '');

    const isYouTubeUrl = (value) => {
        try {
            const u = new URL(value);
            return /youtube.com|youtu.be/.test(u.hostname);
        } catch (e) {
            return false;
        }
    };

    // normalize urls for duplicate detection
    const normalizeLink = (u = '') => u.trim().replace(/\/?$/, '').toLowerCase();

    // use YouTube oEmbed to get title and thumbnail (public, no API key)
    const fetchYouTubeMeta = async (videoUrl) => {
        try {
            setLoading(true);
            setError('');
            const oembed = `https://www.youtube.com/oembed?url=${encodeURIComponent(
                videoUrl
            )}&format=json`;
            const res = await fetch(oembed);
            if (!res.ok) throw new Error('Failed to fetch oEmbed');
            const data = await res.json();
            setTitle(data.title || '');
            setThumbnail(data.thumbnail_url || '');
        } catch (err) {
            console.error('oEmbed error', err);
            setError('Failed to fetch YouTube metadata');
            setTitle('');
            setThumbnail('');
        } finally {
            setLoading(false);
        }
    };

    const handleLinkChange = (e) => {
        const v = e.target.value;
        setLink(v);
        setError('');
        setTitle('');
        setThumbnail('');
        if (v && songs.some((s) => normalizeLink(s.link || '') === normalizeLink(v))) {
            setError('This link is already in the playlist');
            return;
        }
        if (v && isYouTubeUrl(v)) {
            fetchYouTubeMeta(v);
        } else if (v && v.trim() !== '') {
            setError('Only YouTube links are allowed');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (!link.trim()) return setError('Link is required');
        if (songs.some((s) => normalizeLink(s.link || '') === normalizeLink(link)))
            return setError('This link is already in the playlist');
        if (!isYouTubeUrl(link)) return setError('Only YouTube links are allowed');
        if (!title) return setError('Waiting for YouTube metadata');

        const newSong = {
            contentId: `song${Date.now()}`,
            title: title.trim(),
            link: link.trim(),
            createAt: new Date().toISOString(),
            thumbnail: thumbnail || '',
        };
        // call provided addSong
        if (typeof addSong === 'function') {
            if (!pl.playId) return setError('Playlist not ready');
            addSong(pl.playId, newSong);
        } else {
            console.warn('addSong not provided');
        }

        setLink('');
        setTitle('');
        setThumbnail('');
        linkInputRef.current?.focus();
    };

    // focus input on initial mount
    useEffect(() => {
        linkInputRef.current?.focus();
    }, []);

    // keep local title in sync when playlist prop changes
    useEffect(() => {
        const t = pl.title || '';
        setLocalTitle(t);
        if (!isEditingTitle) setEditTitle(t);
    }, [pl.title]);

    const startEditTitle = () => {
        setEditTitle(localTitle || '');
        setIsEditingTitle(true);
        setError('');
    };

    const cancelEditTitle = () => {
        setEditTitle(localTitle || '');
        setIsEditingTitle(false);
        setError('');
    };

    const confirmEditTitle = async () => {
        const newT = (editTitle || '').trim();
        if (!newT) return setError('Title cannot be empty');
        // call update callback if provided, otherwise just update locally
        if (typeof updatePlaylistTitle === 'function') {
            try {
                const res = updatePlaylistTitle(pl.playId, newT);
                // handle promise or sync return
                if (res && typeof res.then === 'function') await res;
                setLocalTitle(newT);
                setIsEditingTitle(false);
            } catch (err) {
                console.error('updatePlaylistTitle error', err);
                setError('Failed to update playlist title');
            }
        } else {
            setLocalTitle(newT);
            setIsEditingTitle(false);
        }
    };

    return (
        <div className='Playlist'>
            <div className='playlist-title'>
                {!isEditingTitle ? (
                    <div className='title-view'>
                        <div className='title-text'>{localTitle}</div>
                        <button
                            type='button'
                            className='title-edit-btn'
                            aria-label='Edit playlist title'
                            onClick={startEditTitle}
                        >
                            {/* pencil icon */}
                            <svg
                                width='16'
                                height='16'
                                viewBox='0 0 24 24'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z'
                                    stroke='currentColor'
                                    strokeWidth='1'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                                <path
                                    d='M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z'
                                    stroke='currentColor'
                                    strokeWidth='1'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div className='title-edit'>
                        <input
                            className='title-edit-input'
                            type='text'
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            aria-label='Edit playlist title input'
                        />
                        <div className='title-edit-btns'>
                            <button
                                type='button'
                                className='title-confirm-btn'
                                aria-label='Confirm title'
                                onClick={confirmEditTitle}
                            >
                                {/* check icon */}
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M20 6L9 17l-5-5'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </svg>
                            </button>
                            <button
                                type='button'
                                className='title-cancel-btn'
                                aria-label='Cancel title edit'
                                onClick={cancelEditTitle}
                            >
                                {/* X icon */}
                                <svg
                                    width='16'
                                    height='16'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                >
                                    <path
                                        d='M18 6L6 18M6 6l12 12'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className='playlist-contents'>
                {songs.length > 0 ? (
                    <ReactGridLayout
                        className='layout'
                        layout={layout}
                        cols={12}
                        width={1150}
                        rowHeight={70}
                        margin={[0, 0]}
                        isDraggable={true}
                        draggableHandle='.playlist-item-drag'
                        draggableAxis='y'
                        onLayoutChange={(newLayout) => {
                            // newLayout is array with {i, y}; reorder songs by y
                            const ordered = newLayout
                                .slice()
                                .sort((a, b) => a.y - b.y)
                                .map((l) => l.i);
                            const newSongs = ordered.map((id, idx) => {
                                const s =
                                    songs.find((x) => (x.contentId || '') === id) || songs[idx];
                                return { ...s, SEQ: String(idx + 1) };
                            });
                            if (typeof updatePlaylistSongs === 'function') {
                                updatePlaylistSongs(pl.playId, newSongs);
                            }
                        }}
                    >
                        {songs.map((item, idx) => (
                            <div key={item.contentId || idx.toString()}>
                                <PlaylistItem
                                    item={item}
                                    deletePlaylistSongs={deletePlaylistSongs}
                                    playId={pl.playId}
                                />
                            </div>
                        ))}
                    </ReactGridLayout>
                ) : (
                    <div className='no-playlist'>No Playlist Available</div>
                )}
            </div>

            <div className='playlist-input'>
                <form onSubmit={handleSubmit} className='playlist-form'>
                    <div className='input-pill'>
                        {thumbnail ? (
                            <img className='thumb-preview' src={thumbnail} alt='thumb' />
                        ) : (
                            <div className='thumb-placeholder' />
                        )}

                        <input
                            className='link-input'
                            type='text'
                            placeholder='Paste YouTube link here (only YouTube)'
                            value={link}
                            onChange={handleLinkChange}
                            ref={linkInputRef}
                        />

                        <button className='add-btn' type='submit' aria-label='Add song'>
                            <svg
                                width='18'
                                height='18'
                                viewBox='0 0 24 24'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M5 12h14M13 5l7 7-7 7'
                                    stroke='currentColor'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                        </button>
                    </div>

                    <div className='meta-row'>
                        {loading ? (
                            <div className='loading'>Loading metadata...</div>
                        ) : title ? (
                            <div className='song-title'>{title}</div>
                        ) : (
                            <div className='hint'>
                                Title will appear here after entering a YouTube link
                            </div>
                        )}
                        {error && <div className='error'>{error}</div>}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Playlist;
