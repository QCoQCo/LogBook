import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import * as Common from './components/common';
import * as Pages from './components/pages';
import { LogBookProvider, AuthProvider } from './context/LogBookContext';

import './App.css';

const Layout = () => {
    return (
        // 체팅페이지 다크모드 판별
        <div id='Layout'>
            <Common.Header />
            <main>
                <Outlet />
            </main>
            <Common.Footer />
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
        <AuthProvider>
            <LogBookProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path='/' element={<Layout />}>
                            <Route index element={<Pages.HomePage />} />
                            <Route path='/chat' element={<Pages.ChatPage />} />
                            <Route
                                path='/playlist/:playId'
                                element={
                                    <Pages.Playlist
                                        playlist={playlist}
                                        addSong={addSong}
                                        updatePlaylistSongs={updatePlaylistSongs}
                                        deletePlaylistSongs={deletePlaylistSongs}
                                    />
                                }
                            />
                            <Route path='/blog' element={<Pages.Blog />} />
                            <Route path='/signUp' element={<Pages.SignUp />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </LogBookProvider>
        </AuthProvider>
    );
}

export default App;
