import { Link } from 'react-router-dom';
import './BlogPlaylistItem.scss';

const BlogPlaylistItem = ({ playlist, onPlay, onDelete }) => {
    const handlePlay = (e) => {
        onPlay(playlist.playId);
    };

    const handleDelete = (e) => {
        if (confirm(`「${playlist.title}」 을 삭제하시겠습니까?`)) onDelete(playlist.playId);
    };

    return (
        <div className='BlogPlaylistItem'>
            <Link
                to={`/playlist/${playlist.playId}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
                className='playlist-link'
            >
                <div className='playlist' key={playlist.playId}>
                    <div
                        className='playlist-row'
                        style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'center',
                        }}
                    >
                        <div
                            className='playlist-thumb'
                            style={{
                                flex: '0 0 40%',
                                maxWidth: 120,
                                height: '100%',
                            }}
                        >
                            <img
                                src={playlist.songs[0].thumbnail || '/img/logBook_logo.png'}
                                alt={playlist.title || 'Playlist Thumbnail'}
                                loading='lazy'
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                }}
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/img/logBook_logo.png';
                                }}
                            />
                        </div>
                        <div className='playlist-body' style={{ flex: 1 }}>
                            <h3 className='playlist-title'>{playlist.title}</h3>
                        </div>
                    </div>
                </div>
            </Link>
            <div className='playlist-item-buttons'>
                <button
                    type='button'
                    className='btn play'
                    onClick={handlePlay}
                    aria-label={`재생 ${playlist.title}`}
                    title='재생'
                >
                    {/* inline SVG — fill = currentColor (SCSS에서 currentColor 사용) */}
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M8 5v14l11-7z' />
                    </svg>
                </button>

                <button
                    type='button'
                    className='btn delete'
                    onClick={handleDelete}
                    aria-label={`삭제 ${playlist.title}`}
                    title='삭제'
                >
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M6 7h12v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-4h6l1 1H8l1-1z' />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default BlogPlaylistItem;
