import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Login from './Login';
import { useLogBook, useAuth } from '../../context/LogBookContext';
import UserInfoModal from '../chat/UserInfoModal';
import {
    initAuthChannel,
    addAuthListener,
    migrateLocalToSession,
    sendAuthEvent,
} from '../../utils/sessionSync';
import './Header.scss';

const Header = () => {
    const navigate = useNavigate();
    const { isChatPage, getUserInfo, getUserProfilePhoto, userDataLoaded } = useLogBook(); // 다크모드 상태 구독
    const [showLogin, setShowLogin] = useState(false);
    const { currentUser, isLogin, logout } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserModal, setShowUserModal] = useState(false);
    const searchRef = useRef(null);
    const searchAreaRef = useRef(null);
    const searchAreaElRef = useRef(null);
    const menuRef = useRef(null);

    // 현재 로그인한 사용자의 상세 정보 가져오기
    const currentUserInfo =
        isLogin && currentUser ? getUserInfo(currentUser.id, currentUser.nickName) : null;
    const currentUserProfilePhoto =
        isLogin && currentUser ? getUserProfilePhoto(currentUser.id, currentUser.nickName) : null;

    const toggleLogin = () => setShowLogin((s) => !s);
    const toggleMenu = () => setShowMenu((s) => !s);
    const toggleSearch = () => {
        console.debug('[Header] toggleSearch, before:', showSearch);
        setShowSearch((s) => !s);
    };

    // 사용자 프로필 모달 관련 핸들러
    const handleProfileClick = () => {
        setShowUserModal(true);
        setShowMenu(false); // 메뉴 닫기
    };

    const handleModalClose = () => {
        setShowUserModal(false);
    };

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

    // autofocus search input when opened: use transitionend event on the .search-area element
    useEffect(() => {
        const el = searchAreaElRef.current;
        if (!showSearch || !el) return;
        console.debug('[Header] waiting for transitionend to focus input');
        let didFocus = false;
        const onTransitionEnd = (e) => {
            if (e.target !== el) return;
            if (e.propertyName !== 'transform' && e.propertyName !== 'opacity') return;
            didFocus = true;
            try {
                searchRef.current && searchRef.current.focus();
            } catch (err) {
                // ignore
            }
        };
        el.addEventListener('transitionend', onTransitionEnd);
        const fallback = setTimeout(() => {
            if (!didFocus) {
                try {
                    searchRef.current && searchRef.current.focus();
                } catch (err) {
                    // ignore
                }
            }
        }, 420);
        return () => {
            el.removeEventListener('transitionend', onTransitionEnd);
            clearTimeout(fallback);
        };
    }, [showSearch]);

    const handleLogout = () => {
        try {
            logout();
        } catch (e) {
            // ignore
        }
        setShowMenu(false);
        navigate('/');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const q = searchQuery && searchQuery.trim();
        if (q) {
            // navigate to a search route. If you don't have a route, adjust as needed.
            try {
                navigate(`/search?q=${encodeURIComponent(q)}`);
            } catch (err) {
                // ignore navigation errors
                console.debug('[Header] search navigate failed', err);
            }
        }
        setShowSearch(false);
        setSearchQuery('');
    };

    return (
        <header id='Header' className={isChatPage ? 'dark-mode' : ''}>
            <div className='container'>
                <div className='left'>
                    <Link to='/'>
                        <div className='logo' />
                        <div className='title' />
                    </Link>
                </div>

                <div className='right'>
                    <div className='search-wrapper' ref={searchAreaRef}>
                        <div
                            className={`search-area ${showSearch ? 'open' : ''}`}
                            ref={searchAreaElRef}
                        >
                            <form onSubmit={handleSearchSubmit}>
                                <div className='search-input'>
                                    <span className='input-icon' aria-hidden>
                                        <svg
                                            xmlns='http://www.w3.org/2000/svg'
                                            viewBox='0 0 24 24'
                                            width='16'
                                            height='16'
                                            fill='currentColor'
                                        >
                                            <path d='M10 2a8 8 0 105.292 14.292l4.707 4.707 1.414-1.414-4.707-4.707A8 8 0 0010 2zm0 2a6 6 0 110 12A6 6 0 0110 4z' />
                                        </svg>
                                    </span>
                                    <input
                                        ref={searchRef}
                                        type='text'
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder='검색어를 입력하세요'
                                        aria-label='검색어'
                                    />
                                    {searchQuery && (
                                        <button
                                            type='button'
                                            className='clear-btn'
                                            aria-label='입력 초기화'
                                            onClick={() => {
                                                setSearchQuery('');
                                                try {
                                                    searchRef.current && searchRef.current.focus();
                                                } catch (e) {
                                                    // ignore
                                                }
                                            }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className={`search-btn ${showSearch ? 'active' : ''}`}>
                        <button
                            type='button'
                            className='search-toggle'
                            aria-label={showSearch ? '검색 닫기' : '검색'}
                            aria-expanded={showSearch}
                            onClick={toggleSearch}
                        >
                            {showSearch ? (
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    viewBox='0 0 24 24'
                                    width='18'
                                    height='18'
                                >
                                    <path
                                        d='M18.3 5.71a1 1 0 00-1.41 0L12 10.59 7.11 5.7A1 1 0 105.7 7.11L10.59 12l-4.9 4.89a1 1 0 101.41 1.41L12 13.41l4.89 4.9a1 1 0 001.41-1.41L13.41 12l4.9-4.89a1 1 0 000-1.4z'
                                        fill='currentColor'
                                    />
                                </svg>
                            ) : (
                                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 640'>
                                    <path d='M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z' />
                                </svg>
                            )}
                        </button>
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
                                    {currentUserProfilePhoto || currentUser?.profilePhoto ? (
                                        <img
                                            src={
                                                currentUserProfilePhoto ||
                                                currentUser?.profilePhoto ||
                                                '/img/userProfile-ex.png'
                                            }
                                            alt={
                                                currentUser?.nickName
                                                    ? `${currentUser.nickName} 프로필`
                                                    : '사용자 프로필'
                                            }
                                            onError={(e) => {
                                                // 이미지 로드 실패 시 숨기고 텍스트 표시
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (
                                                    parent &&
                                                    !parent.querySelector('.fallback-user-name')
                                                ) {
                                                    const nameSpan = document.createElement('span');
                                                    nameSpan.className =
                                                        'fallback-user-name user-name';
                                                    nameSpan.textContent =
                                                        currentUser?.nickName || '사용자';
                                                    parent.appendChild(nameSpan);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <span className='user-name no-profile-image'>
                                            {currentUser?.nickName || '사용자'}
                                        </span>
                                    )}
                                </button>
                                {showMenu && (
                                    <ul className='user-menu' role='menu'>
                                        {currentUserInfo && (
                                            <li role='menuitem'>
                                                <button type='button' onClick={handleProfileClick}>
                                                    내 프로필
                                                </button>
                                            </li>
                                        )}
                                        <li role='menuitem'>
                                            <Link to={`/myPage?userId=${currentUserInfo.userId}`}>
                                                내 블로그
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
                                {showLogin && <Login onClose={toggleLogin} />}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 사용자 정보 모달 */}
            {currentUserInfo && (
                <UserInfoModal
                    isOpen={showUserModal}
                    onClose={handleModalClose}
                    userInfo={currentUserInfo}
                    currentUserId={currentUser?.id}
                    isOwnProfile={true}
                />
            )}
        </header>
    );
};

export default Header;
