// Blog.jsx
import { useState, useEffect, act } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBlog, useAuth, useUserData } from '../../context';
import { BlogFloatingUi, BlogGridLayout, BlogUserInfo, BlogPlaylist } from '../blog';
import BlogElementModal from '../blog/BlogElementModal';
import axios from 'axios';

import './Blog.scss';

const Blog = () => {
    // 블로그 페이지의 userId 파라미터
    const [searchParam] = useSearchParams();
    const userId = searchParam.get('userId');

    // Blog Context 사용
    const { clickedItem, isBlogEditting, activeTab, setActiveTab } = useBlog();

    // UserData Context 사용
    const { getUserInfo } = useUserData();
    // Modal 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { currentUser } = useAuth();

    const releaseModal = () => {
        setIsModalOpen(false);
    };

    const enableModal = () => {
        setIsModalOpen(true);
    };

    const isOwner = Boolean(currentUser && userId && String(currentUser?.id) === String(userId));

    const handleActiveTab = (n) => {
        // console.log('activeTab: ', n);
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
                        {activeTab === 3 && <BlogPlaylist userId={userId} isOwner={isOwner} />}
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
