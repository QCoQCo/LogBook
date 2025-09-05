import { useRef } from 'react';
import './PlaylistItem.scss';

const PlaylistItem = ({ item, deletePlaylistSongs, playId, onPlay, isActive, isOwner }) => {
    const dragHandleRef = useRef(null);

    const handlePlaylistItemDelete = () => {
        if (confirm(`"${item.title}" 을(를) 삭제하시겠습니까?`)) {
            deletePlaylistSongs(playId, item.contentId);
        }
    };

    const handlePlay = () => {
        if (typeof onPlay === 'function') {
            onPlay();
        }
    };

    return (
        <div className={`playlistItem ${isActive ? 'playlist-item--active' : ''}`}>
            {isOwner && (
                <div className='playlist-item-drag' ref={dragHandleRef}>
                    <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        xmlns='http://www.w3.org/2000/svg'
                        aria-hidden
                    >
                        <path
                            d='M3 6h18M3 12h18M3 18h18'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                </div>
            )}
            <a href={item.link} target='_blank' rel='noopener noreferrer'>
                <div className='playlist-item-profile'>
                    <img
                        src={item.thumbnail}
                        alt='프로필'
                        style={{ width: '100%', borderRadius: '50%' }}
                    />
                </div>
                <div className='playlist-item-title'>{item.title}</div>
            </a>
            <div
                className='playlist-item-controls'
                style={{ width: isOwner ? '48px' : '24px', gap: '5px' }}
            >
                <button
                    className='playlist-item-btn playlist-item-play-btn'
                    aria-label='재생'
                    title='재생'
                    onClick={handlePlay}
                >
                    <svg
                        width='14'
                        height='14'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                        xmlns='http://www.w3.org/2000/svg'
                        aria-hidden
                    >
                        <path d='M8 5v14l11-7z' />
                    </svg>
                </button>
                {isOwner && (
                    <button
                        className='playlist-item-btn playlist-item-del-btn'
                        aria-label='삭제'
                        title='삭제'
                        onClick={handlePlaylistItemDelete}
                    >
                        <svg
                            width='14'
                            height='14'
                            viewBox='0 0 24 24'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                            aria-hidden
                        >
                            <path
                                d='M6 6l12 12M18 6L6 18'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default PlaylistItem;
