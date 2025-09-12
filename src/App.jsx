import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './context/LogBookContext';
import * as Common from './components/common';
import * as Pages from './components/pages';
import { LogBookProvider, AuthProvider, YTPopupProvider } from './context/LogBookContext';

import './App.css';
import './utils/animations.css';

const Layout = () => {
    const { isLogin } = useAuth();

    return (
        // 체팅페이지 다크모드 판별
        <div id='Layout'>
            <Common.Header />
            <main>
                <Outlet />
            </main>
            {isLogin && <Common.FloatingButton />}
            <Common.Footer />
        </div>
    );
};

function App() {
    const [playlist, setPlaylist] = useState([]);
    const { currentUser } = useAuth();

    const userId =
        currentUser?.userId ||
        currentUser?.id ||
        (() => {
            try {
                const raw =
                    sessionStorage.getItem('logbook_current_user') ||
                    localStorage.getItem('logbook_current_user');
                return raw ? JSON.parse(raw).userId || JSON.parse(raw).id : null;
            } catch (e) {
                return null;
            }
        })() ||
        localStorage.getItem('userId') ||
        null;

    useEffect(() => {
        fetchPlaylists();
    }, [playlist]);

    const fetchPlaylists = async () => {
        try {
            const response = await axios.get(`/data/playlistData.json`);
            if (response.status === 200) {
                setPlaylist(response.data);
            }
            try {
                const key = `playlists_${userId}`;
                const raw = localStorage.getItem(key);
                const localLists = raw ? JSON.parse(raw) : [];

                // 병합: 로컬에 있는 항목을 우선으로 하고 서버 항목은 존재하지 않을 때만 추가
                const merged = [
                    ...localLists,
                    ...playlist.filter((s) => !localLists.some((l) => l.playId === s.playId)),
                ];
                setPlaylist(merged);
            } catch (e) {
                console.error('localStorage load error', e);
                setPlaylist(userLists);
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
            <YTPopupProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path='/' element={<Layout />}>
                            <Route index element={<Pages.LogBookIntro />} />
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
                            <Route path='/feed' element={<Pages.FeedPage />} />
                            <Route path='/post/detail' element={<Pages.PostDetail />} />
                            <Route path='/post/write' element={<Pages.PostEdit isEdit={false} />} />
                            <Route path='/post/edit' element={<Pages.PostEdit isEdit={true} />} />
                        </Route>
                    </Routes>
                </BrowserRouter>
            </YTPopupProvider>
        </LogBookProvider>
    );
}

export default App;
