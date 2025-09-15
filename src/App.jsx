import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import * as Common from './components/common';
import * as Pages from './components/pages';
import {
    AuthProvider,
    useAuth,
    ChatProvider,
    BlogProvider,
    PlaylistProvider,
    YTPopupProvider,
    UserDataProvider,
    UIProvider,
} from './context';
import { PostRoutes } from './routes';

import './App.css';
import './utils/animations.css';
import { PostProvider } from './context/PostContext';

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
            <UserDataProvider>
                <UIProvider>
                    <ChatProvider>
                        <BlogProvider>
                            <PostProvider>
                                <PlaylistProvider>
                                    <YTPopupProvider>
                                        <BrowserRouter>
                                            <Routes>
                                                <Route path='/' element={<Layout />}>
                                                    <Route index element={<Pages.LogBookIntro />} />
                                                    <Route
                                                        path='/chat'
                                                        element={<Pages.ChatPage />}
                                                    />
                                                    <Route
                                                        path='/playlist/:playId'
                                                        element={<Pages.Playlist />}
                                                    />
                                                    <Route path='/blog' element={<Pages.Blog />} />
                                                    <Route
                                                        path='/signUp'
                                                        element={<Pages.SignUp />}
                                                    />
                                                    <Route
                                                        path='/feed'
                                                        element={<Pages.FeedPage />}
                                                    />
                                                    <Route
                                                        path='/post/*'
                                                        element={<PostRoutes />}
                                                    />
                                                    <Route
                                                        path='error'
                                                        element={<Pages.ErrorPage />}
                                                    />
                                                </Route>
                                            </Routes>
                                        </BrowserRouter>
                                    </YTPopupProvider>
                                </PlaylistProvider>
                            </PostProvider>
                        </BlogProvider>
                    </ChatProvider>
                </UIProvider>
            </UserDataProvider>
        </AuthProvider>
    );
}

export default App;
