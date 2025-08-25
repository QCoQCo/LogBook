import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import * as Common from './components/common';
import * as Pages from './components/pages';
import { LogBookProvider } from './context/LogBookContext';
import axios from 'axios';

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
            console.log(response);
            if (response.status == 200) {
                setPlaylist(response.data);
            }
        } catch (error) {
            console.error('Error fetching playlists:', error);
            return [];
        }
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
                            element={<Pages.Playlist playlist={playlist} />}
                        />
                    </Route>
                </Routes>
            </BrowserRouter>
        </LogBookProvider>
    );
}

export default App;
