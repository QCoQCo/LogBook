import { useRef } from 'react';
import './PlaylistItem.scss';

const PlaylistItem = ({ item, idx }) => {
    const dragHandleRef = useRef(null);

    return (
        <div className='playlistItem'>
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
            <div className='playlistItemDrag' ref={dragHandleRef}>
                <span style={{ fontSize: '1.5rem' }}>≡</span>
            </div>
        </div>
    );
};

export default PlaylistItem;
