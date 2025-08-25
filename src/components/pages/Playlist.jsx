import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PlaylistItem from './PlaylistItem';

import ReactGridLayout from 'react-grid-layout';
import './Playlist.scss';

const Playlist = ({ playlist, addSong, updatePlaylistSongs, deletePlaylistSongs }) => {
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

    return (
        <div className='Playlist'>
            <div className='playlistTitle'>{pl.title}</div>
            <div className='playlistContents'>
                {songs.length > 0 ? (
                    <ReactGridLayout
                        className='layout'
                        layout={layout}
                        cols={12}
                        width={1150}
                        rowHeight={70}
                        margin={[0, 0]}
                        isDraggable={true}
                        draggableHandle='.playlistItemDrag'
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
                    <div className='noPlaylist'>No Playlist Available</div>
                )}
            </div>

            <div className='playlistInput'>
                <form onSubmit={handleSubmit} className='playlistForm'>
                    <div className='inputPill'>
                        {thumbnail ? (
                            <img className='thumbPreview' src={thumbnail} alt='thumb' />
                        ) : (
                            <div className='thumbPlaceholder' />
                        )}

                        <input
                            className='linkInput'
                            type='text'
                            placeholder='Paste YouTube link here (only YouTube)'
                            value={link}
                            onChange={handleLinkChange}
                            ref={linkInputRef}
                        />

                        <button className='addBtn' type='submit' aria-label='Add song'>
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

                    <div className='metaRow'>
                        {loading ? (
                            <div className='loading'>Loading metadata...</div>
                        ) : title ? (
                            <div className='songTitle'>{title}</div>
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
