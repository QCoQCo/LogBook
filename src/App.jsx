import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Header, Footer } from './components/common';
import { HomePage } from './components/pages';
import './App.css';

const Layout = () => {
    return (
        <div id='Layout'>
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Layout />}>
                    <Route index element={<HomePage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
