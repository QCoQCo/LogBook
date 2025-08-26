import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import * as Common from './components/common';
import * as Pages from './components/pages';
import { LogBookProvider } from './context/LogBookContext';

import './App.css';
import { initAuthChannel, addAuthListener, migrateLocalToSession } from './utils/sessionSync';

const Layout = () => {
    const [isLogin, setLogin] = useState(false);

    const handleLoginState = (state) => {
        setLogin(state);
    };

    useEffect(() => {
        // initialize auth channel and migrate any legacy storage
        try {
            initAuthChannel();
        } catch (e) {
            // ignore
        }
        try {
            migrateLocalToSession();
        } catch (e) {
            // ignore
        }
        // set initial login state from sessionStorage (fallback to localStorage)
        try {
            const raw =
                sessionStorage.getItem('logbook_current_user') ||
                localStorage.getItem('logbook_current_user');
            setLogin(!!raw);
        } catch (e) {
            // ignore
        }

        // listen for auth events from other tabs
        const unsub = addAuthListener((data) => {
            if (!data || !data.type) return;
            if (data.type === 'login') setLogin(true);
            if (data.type === 'logout') setLogin(false);
        });
        return () => {
            try {
                unsub();
            } catch (e) {
                // ignore
            }
        };
    }, []);

    return (
        // 체팅페이지 다크모드 판별
        <div id='Layout'>
            <Common.Header isLogin={isLogin} handleLoginState={handleLoginState} />
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
                        <Route path='/myPage' element={<Pages.MyPage />} />
                        <Route path='/signUp' element={<Pages.SignUp />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </LogBookProvider>
    );
}

export default App;
