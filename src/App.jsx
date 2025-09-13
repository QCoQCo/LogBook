import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import * as Common from './components/common';
import * as Pages from './components/pages';
import {
    LogBookProvider,
    YTPopupProvider,
    useAuth,
    useLogBook,
    AuthProvider,
} from './context/LogBookContext';

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
    return (
        <AuthProvider>
            <LogBookProvider>
                <YTPopupProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path='/' element={<Layout />}>
                                <Route index element={<Pages.LogBookIntro />} />
                                <Route path='/chat' element={<Pages.ChatPage />} />
                                <Route path='/playlist/:playId' element={<Pages.Playlist />} />
                                <Route path='/blog' element={<Pages.Blog />} />
                                <Route path='/signUp' element={<Pages.SignUp />} />
                                <Route path='/feed' element={<Pages.FeedPage />} />
                                <Route path='/post/detail' element={<Pages.PostDetail />} />
                                <Route
                                    path='/post/write'
                                    element={<Pages.PostEdit isEdit={false} />}
                                />
                                <Route
                                    path='/post/edit'
                                    element={<Pages.PostEdit isEdit={true} />}
                                />
                                <Route path='error' element={<Pages.ErrorPage />} />
                            </Route>
                        </Routes>
                    </BrowserRouter>
                </YTPopupProvider>
            </LogBookProvider>
        </AuthProvider>
    );
}

export default App;
