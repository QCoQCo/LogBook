import PlaylistItem from './PlaylistItem';

import ReactGridLayout from 'react-grid-layout';
import './Playlist.scss';

const Playlist = ({ playlist }) => {
    const songs = playlist[0]?.songs || [];

    const layout = songs.map((item, idx) => ({
        i: item.contentId || idx.toString(),
        x: 0,
        y: idx,
        w: 12,
        h: 1,
    }));

    return (
        <div className='Playlist'>
            <div className='playlistTitle'>{playlist[0]?.title}</div>
            {songs.length > 0 ? (
                <ReactGridLayout
                    className='layout'
                    layout={layout}
                    cols={12}
                    width={1200}
                    rowHeight={70}
                    margin={[0, 0]}
                    isDraggable={true}
                    draggableHandle='.playlistItemDrag'
                    draggableAxis='y'
                >
                    {songs.map((item, idx) => (
                        <div key={item.contentId || idx.toString()}>
                            <PlaylistItem item={item} idx={idx} />
                        </div>
                    ))}
                </ReactGridLayout>
            ) : (
                <div className='noPlaylist'>No Playlist Available</div>
            )}
            <div className='playlistInput'>
                <input type='text' placeholder='Add a new song...' />
                <button>Add Song</button>
            </div>
        </div>
    );
};

export default Playlist;
