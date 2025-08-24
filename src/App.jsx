import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import * as Common from './components/common';
import * as Pages from './components/pages';
import { LogBookProvider } from './context/LogBookContext';

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
    return (
        <LogBookProvider>
            <BrowserRouter>
                <Routes>
                    <Route path='/' element={<Layout />}>
                        <Route index element={<Pages.HomePage />} />
                        <Route path='/chat' element={<Pages.ChatPage />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </LogBookProvider>
    );
}

export default App;
