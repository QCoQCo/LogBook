import { useRef } from 'react';
import './PlaylistItem.scss';

const PlaylistItem = ({ item, deletePlaylistSongs, playId }) => {
    const dragHandleRef = useRef(null);

    const handlePlaylistItemDelete = () => {
        if (confirm(`"${item.title}" 을(를) 삭제하시겠습니까?`)) {
            deletePlaylistSongs(playId, item.contentId);
        }
    };

    return (
        <div className='playlistItem'>
            <div className='playlistItemDrag' ref={dragHandleRef}>
                <span style={{ fontSize: '1.5rem' }}>≡</span>
            </div>
            <a href={item.link} target='_blank' rel='noopener noreferrer'>
                <div className='playlistItemProfile'>
                    <img
                        src={item.thumbnail}
                        alt='프로필'
                        style={{ width: '100%', borderRadius: '50%' }}
                    />
                </div>
                <div className='playlistItemTitle'>{item.title}</div>
            </a>
            <div className='playlistItemBtn'>
                <button
                    className='playlistItemDelBtn'
                    aria-label='삭제'
                    title='삭제'
                    onClick={handlePlaylistItemDelete}
                >
                    −
                </button>
            </div>
        </div>
    );
};

export default PlaylistItem;
