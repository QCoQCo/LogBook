import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';

import * as common from './components/common';
import * as pages from './components/pages';
import axios from 'axios';
import './App.css';

const Layout = () => {
    return (
        <div id='Layout'>
            <common.Header />
            <main>
                <Outlet />
            </main>
            <common.Footer />
        </div>
    );
};

function App() {
    const [playlist, setPlaylist] = useState([]);

    useEffect(() => {
        fetchPlaylists();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const response = await axios.get(`/data/playlistData.json`);
            if (response.status === 200) {
                setPlaylist(response.data);
            }
        } catch (error) {
            console.error('Error fetching playlists:', error);
        }
    };

    const addSong = (playId, song) => {
        setPlaylist((prev) =>
            prev.map((pl) => {
                if (pl.playId !== playId) return pl;
                const existing = pl.songs || [];
                const maxSeq = existing.reduce((m, s) => Math.max(m, Number(s.SEQ) || 0), 0);
                const newSong = { ...song, SEQ: String(maxSeq + 1) };
                return { ...pl, songs: [...existing, newSong] };
            })
        );
    };

    const updatePlaylistSongs = (playId, songs) => {
        setPlaylist((prev) => prev.map((pl) => (pl.playId === playId ? { ...pl, songs } : pl)));
    };

    const deletePlaylistSongs = (playId, contentId) => {
        setPlaylist((prev) =>
            prev.map((pl) => {
                if (pl.playId !== playId) return pl;
                const existing = pl.songs || [];
                const updatedSongs = existing.filter((song) => song.contentId !== contentId);
                return { ...pl, songs: updatedSongs };
            })
        );
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Layout />}>
                    <Route index element={<pages.HomePage />} />
                    <Route
                        path='/playlist/:playId'
                        element={
                            <pages.Playlist
                                playlist={playlist}
                                addSong={addSong}
                                updatePlaylistSongs={updatePlaylistSongs}
                                deletePlaylistSongs={deletePlaylistSongs}
                            />
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
