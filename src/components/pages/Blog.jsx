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
    const { clickedItem, isBlogEditting, getUserInfo, activeTab, setActiveTab } = useLogBook();
    // Modal 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { currentUser } = useAuth();
    const [playlists, setPlaylists] = useState([]);

    const releaseModal = () => {
        setIsModalOpen(false);
    };

    const enableModal = () => {
        setIsModalOpen(true);
    };

    const isOwner = Boolean(currentUser && userId && String(currentUser?.id) === String(userId));

    const fetchPlaylist = async () => {
        try {
            const response = await axios.get(`/data/playlistData.json`);

            if (response.status === 200) {
                const userLists = Array.isArray(response.data)
                    ? response.data.filter((item) => item.userId === userId)
                    : [];
                // localStorage에서 사용자별 저장된 플레이리스트 로드
                try {
                    const key = `playlists_${userId}`;
                    const raw = localStorage.getItem(key);
                    const localLists = raw ? JSON.parse(raw) : [];

                    // 병합: 로컬에 있는 항목을 우선으로 하고 서버 항목은 존재하지 않을 때만 추가
                    const merged = [
                        ...localLists,
                        ...userLists.filter((s) => !localLists.some((l) => l.playId === s.playId)),
                    ];
                    setPlaylists(merged);
                } catch (e) {
                    console.error('localStorage load error', e);
                    setPlaylists(userLists);
                }
            }
        } catch (error) {
            console.error('Error fetching playlist:', error);
        }
    };

    useEffect(() => {
        fetchPlaylist();
    }, [userId]);

    // sync tab query param to context on mount/param change
    useEffect(() => {
        console.log(activeTab);
        // const n = Number(activeTab);
        // if (Number.isInteger(n) && n >= 1 && n <= 3) {
        //     setActiveTab(n);
        // }
        // only run when tabParam changes
    }, []);

    const handleDelete = (playId) => {
        setPlaylists((prev) => {
            const next = prev.filter((p) => {
                const id = p.playId;
                return id !== playId;
            });
            try {
                const key = `playlists_${userId}`;
                localStorage.setItem(key, JSON.stringify(next));
            } catch (e) {
                console.error('localStorage save error', e);
            }
            return next;
        });
    };

    const generatePlayId = () => `play_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const handleAddPlaylist = () => {
        const newPlaylist = {
            playId: generatePlayId(),
            userId: userId || null,
            title: 'new Playlist',
            description: '',
            songs: [],
        };
        setPlaylists((prev) => {
            const next = [...prev, newPlaylist];
            try {
                const key = `playlists_${userId}`;
                localStorage.setItem(key, JSON.stringify(next));
            } catch (e) {
                console.error('localStorage save error', e);
            }
            return next;
        });
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
