import BlogPlaylistItem from './BlogPlaylistItem';
import { useYTPopup } from '../../context/LogBookContext';

import './BlogPlaylist.scss';

const BlogPlaylist = ({ userId, isOwner, playlists, handleDelete, handleAddPlaylist }) => {
    const { openYTPopup } = useYTPopup();

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
                <button onClick={handleAddPlaylist}>+</button>
            </div>
        </div>
    );
};

export default BlogPlaylist;
