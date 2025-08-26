import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Login from './login.jsx';
import './Header.scss';

const Header = ({ isLogin, handleLoginState }) => {
    const navigate = new useNavigate();
    const [showLogin, setShowLogin] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('logbook_current_user');
            if (raw) setCurrentUser(JSON.parse(raw));
        } catch (e) {
            // ignore
        }
    }, []);

    const toggleLogin = () => setShowLogin((s) => !s);
    const toggleMenu = () => setShowMenu((s) => !s);

    useEffect(() => {
        if (!showMenu) return;
        const onDocClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, [showMenu]);

    const handleLogout = () => {
        try {
            localStorage.removeItem('logbook_current_user');
        } catch (e) {
            // ignore
        }
        setCurrentUser(null);
        setShowMenu(false);
        if (typeof handleLoginState === 'function') handleLoginState(false);
        navigate('/');
    };

    return (
        <header id='Header'>
            <div className='container'>
                <div className='left'>
                    <Link to='/'>
                        <div className='logo' />
                        <div className='title' />
                    </Link>
                </div>

                <div className='right'>
                    <div className='search-btn' aria-hidden>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'>
                            <path d='M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z' />
                        </svg>
                    </div>

                    <div className='notification-btn' aria-hidden>
                        <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 448 512'>
                            <path d='M224 0c-17.7 0-32 14.3-32 32l0 3.2C119 50 64 114.6 64 192l0 21.7c0 48.1-16.4 94.8-46.4 132.4L7.8 358.3C2.7 364.6 0 372.4 0 380.5 0 400.1 15.9 416 35.5 416l376.9 0c19.6 0 35.5-15.9 35.5-35.5 0-8.1-2.7-15.9-7.8-22.2l-9.8-12.2C400.4 308.5 384 261.8 384 213.7l0-21.7c0-77.4-55-142-128-156.8l0-3.2c0-17.7-14.3-32-32-32zM162 464c7.1 27.6 32.2 48 62 48s54.9-20.4 62-48l-124 0z' />
                        </svg>
                    </div>

                    <div className='login-btn'>
                        {isLogin ? (
                            <div className='user-area' ref={menuRef}>
                                <button
                                    className='user-profile'
                                    type='button'
                                    aria-label='사용자 메뉴'
                                    aria-haspopup='true'
                                    aria-expanded={showMenu}
                                    onClick={toggleMenu}
                                >
                                    <img
                                        src={currentUser?.avatar || '/img/logBook_logo.png'}
                                        alt={
                                            currentUser?.id
                                                ? `${currentUser.id} 프로필`
                                                : '사용자 프로필'
                                        }
                                        onError={(e) =>
                                            (e.currentTarget.src = '/img/logBook_logo.png')
                                        }
                                    />
                                </button>
                                {showMenu && (
                                    <ul className='user-menu' role='menu'>
                                        <li role='menuitem'>
                                            <a
                                                href='/blog'
                                                target='_blank'
                                                rel='noopener noreferrer'
                                            >
                                                내 블로그
                                            </a>
                                        </li>
                                        <li role='menuitem'>
                                            <Link to='/settings' onClick={() => setShowMenu(false)}>
                                                설정
                                            </Link>
                                        </li>
                                        <li role='menuitem'>
                                            <button type='button' onClick={handleLogout}>
                                                로그아웃
                                            </button>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <div>
                                <button onClick={toggleLogin}>로그인</button>
                                {showLogin && (
                                    <Login
                                        onClose={toggleLogin}
                                        handleLoginState={handleLoginState}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
