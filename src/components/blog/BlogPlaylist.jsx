import { useEffect, useState } from 'react';
import axios from 'axios';
import BlogPlaylistItem from './BlogPlaylistItem';
import { useYTPopup } from '../../context/LogBookContext';

import './BlogPlaylist.scss';

const BlogPlaylist = ({ userId }) => {
    const { openYTPopup } = useYTPopup();
    const [playlists, setPlaylists] = useState([]);

    const fetchPlaylist = async () => {
        try {
            const response = await axios.get(`/data/playlistData.json`);

            if (response.status === 200) {
                const userLists = Array.isArray(response.data)
                    ? response.data.filter((item) => item.userId === userId)
                    : [];
                setPlaylists(userLists);
            }
        } catch (error) {
            console.error('Error fetching playlist:', error);
        }
    };

    useEffect(() => {
        fetchPlaylist();
    }, [userId]);

    const handlePlay = (playlist, startIndex = 0) => {
        const songsRaw = playlist?.songs;
        const songs = Array.isArray(songsRaw) ? songsRaw.filter(Boolean) : [];
        if (!songs.length) return;
        try {
            openYTPopup(songs, startIndex, { clearOnClose: true });
        } catch (e) {
            console.error('play error', e);
        }
    };

    const handleDelete = (playId) => {
        setPlaylists((prev) =>
            prev.filter((p) => {
                const id = p.playId;
                return id !== playId;
            })
        );
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
                    />
                ))
            ) : (
                <div className='noBlogPlaylist'>
                    <p>플레이리스트가 없습니다.</p>
                </div>
            )}
        </div>
    );
};

export default BlogPlaylist;
