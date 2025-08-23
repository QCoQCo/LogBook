import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import * as Common from './components/common';
import * as Pages from './components/pages';

import './App.css';

const Layout = () => {
    return (
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
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Layout />}>
                    <Route index element={<Pages.HomePage />} />
                    <Route path='/chat' element={<Pages.ChatPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
