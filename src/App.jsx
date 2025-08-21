import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import './App.css';

const Layout = () => {
    return (
        <div id='Layout'>
            <Outlet />
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Outlet />}></Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
