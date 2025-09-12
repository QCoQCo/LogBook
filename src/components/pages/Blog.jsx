// Blog.jsx
import { useState, useEffect, act } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLogBook, useAuth } from '../../context/LogBookContext';
import { BlogFloatingUi, BlogGridLayout, BlogUserInfo, BlogPlaylist } from '../blog';
import BlogElementModal from '../blog/BlogElementModal';
import axios from 'axios';

import './Blog.scss';

const Blog = () => {
    // 블로그 페이지의 userId 파라미터
    const [searchParam] = useSearchParams();
    const userId = searchParam.get('userId');

    // 현재 클릭한 element 정보를 전달받기 위한 context의 State
    const {
        clickedItem,
        isBlogEditting,
        getUserInfo,
        activeTab,
        setActiveTab,
        fetchPlaylists,
        getPlaylists,
        addPlaylist: ctxAddPlaylist,
        deletePlaylist: ctxDeletePlaylist,
    } = useLogBook();
    // Modal 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { currentUser } = useAuth();
    // 컴포넌트 로컬 state 대신 context 캐시 사용
    const playlists = getPlaylists(userId) || [];

    const releaseModal = () => {
        setIsModalOpen(false);
    };

    const enableModal = () => {
        setIsModalOpen(true);
    };

    const isOwner = Boolean(currentUser && userId && String(currentUser?.id) === String(userId));

    useEffect(() => {
        if (!userId) return;
        // context의 fetchPlaylists가 내부 캐시에 저장하므로 결과를 set 하지 않음
        fetchPlaylists(userId).catch((e) => {
            console.error('fetchPlaylists error', e);
        });
    }, [userId, fetchPlaylists]);

    const handleDelete = async (playId) => {
        if (!userId) return;
        if (typeof ctxDeletePlaylist === 'function') {
            try {
                await ctxDeletePlaylist(userId, playId);
                return;
            } catch (e) {
                console.error('ctxDeletePlaylist error', e);
            }
        }
        // fallback: localStorage 직접 수정 후 캐시 갱신
        try {
            const key = `playlist_${userId}`;
            const raw = localStorage.getItem(key);
            const arr = raw ? JSON.parse(raw) : [];
            const next = (Array.isArray(arr) ? arr : []).filter((p) => p.playId !== playId);
            localStorage.setItem(key, JSON.stringify(next));
            await fetchPlaylists(userId);
        } catch (e) {
            console.error('localStorage save error', e);
        }
    };

    const generatePlayId = () => `play_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const handleAddPlaylist = async () => {
        const newPlaylist = {
            playId: generatePlayId(),
            userId: userId || null,
            title: 'new Playlist',
            description: '',
            songs: [],
        };
        if (typeof ctxAddPlaylist === 'function') {
            try {
                await ctxAddPlaylist(userId, newPlaylist);
                return;
            } catch (e) {
                console.error('ctxAddPlaylist error', e);
            }
        }
        // fallback: localStorage에 추가 후 캐시 갱신
        try {
            const key = `playlist_${userId}`;
            const raw = localStorage.getItem(key);
            const arr = raw ? JSON.parse(raw) : [];
            const next = [...(Array.isArray(arr) ? arr : []), newPlaylist];
            localStorage.setItem(key, JSON.stringify(next));
            await fetchPlaylists(userId);
        } catch (e) {
            console.error('localStorage save error', e);
        }
    };

    const handleActiveTab = (n) => {
        console.log('activeTab: ', n);
        setActiveTab(n);
    };

    return (
        <div id='Blog'>
            <div className='blog-wrapper'>
                <BlogUserInfo userId={userId} />
                <div className='blog-wrapper-aria'>
                    <div className='blog-wrapper-tab'>
                        <button
                            type='button'
                            className={activeTab === 1 ? 'home active' : 'home'}
                            onClick={() => handleActiveTab(1)}
                            aria-label='home'
                            title='home'
                        >
                            <img
                                src='/img/icon-home.svg'
                                alt='home'
                                style={{ width: 30, height: 30, display: 'block', color: 'black' }}
                            />
                        </button>
                        <button
                            type='button'
                            className={activeTab === 2 ? 'article active' : 'article'}
                            onClick={() => handleActiveTab(2)}
                            aria-label='article'
                            title='article'
                        >
                            <img
                                src='/img/icon-edit.svg'
                                alt='article'
                                style={{ width: 30, height: 30, display: 'block' }}
                            />
                        </button>
                        <button
                            type='button'
                            className={activeTab === 3 ? 'playlist active' : 'playlist'}
                            onClick={() => handleActiveTab(3)}
                            aria-label='playlist'
                            title='playlist'
                        >
                            <img
                                src='/img/icon-playlist.svg'
                                alt='playlist'
                                style={{ width: 30, height: 30, display: 'block' }}
                            />
                        </button>
                    </div>
                    <div className='blog-wrapper-contents'>
                        {activeTab === 1 && (
                            <BlogGridLayout userId={userId} enableModal={enableModal} />
                        )}
                        {activeTab === 2 && <div>Article</div>}
                        {activeTab === 3 && (
                            <BlogPlaylist
                                userId={userId}
                                isOwner={isOwner}
                                playlists={playlists}
                                handleDelete={handleDelete}
                                handleAddPlaylist={handleAddPlaylist}
                            />
                        )}
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <div className='modal-overlay' onClick={releaseModal}>
                    <BlogElementModal item={clickedItem} releaseModal={releaseModal} />
                </div>
            )}
            {isBlogEditting && <BlogFloatingUi />}
        </div>
    );
};

export default Blog;
