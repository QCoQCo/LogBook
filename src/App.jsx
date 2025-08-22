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
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Layout />}>
                    <Route index element={<pages.HomePage />} />
                    <Route
                        path='/playlist/:playId'
                        element={<pages.Playlist playlist={playlist} />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
