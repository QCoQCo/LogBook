// Blog.jsx
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBlog, useAuth, useUserData } from '../../context';
import { BlogFloatingUi, BlogGridLayout, BlogUserInfo, BlogPosts, BlogPlaylist } from '../blog';
import BlogElementModal from '../blog/BlogElementModal';

import './Blog.scss';

const Blog = () => {
    // 블로그 페이지의 userId 파라미터
    const [searchParam] = useSearchParams();
    const userId = searchParam.get('userId');

    // Blog, UserData Context 사용
    const { clickedItem, isBlogEditting, setIsBlogEditting, activeTab, setActiveTab } = useBlog();
    const { userData } = useUserData();
    const { currentUser, isLogin } = useAuth();

    // States
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal 상태 관리
    const [isOwnBlog, setIsOwnBlog] = useState(false); // 블로그 소유자 여부
    const [blogOwnerData, setBlogOwnerData] = useState(null); // 블로그 소유주 데이터

    // Refs
    const postsTabBtnRef = useRef(null);
    const playListTabBtnRef = useRef(null);

    useEffect(() => {
        setBlogOwnerData(userData.find((user) => user.userId === userId));
    }, [userId, userData]);

    useEffect(() => {
        if (isLogin && currentUser) {
            if (currentUser.id === userId) {
                setIsOwnBlog(true);
            } else {
                setIsOwnBlog(false);
            }
        } else {
            setIsOwnBlog(false);
        }
    }, [userId, currentUser]);

    useEffect(() => {
        if (isBlogEditting) {
            postsTabBtnRef.current.disabled = true;
            playListTabBtnRef.current.disabled = true;
        } else {
            postsTabBtnRef.current.disabled = false;
            playListTabBtnRef.current.disabled = false;
        }
    }, [isBlogEditting]);

    const releaseModal = () => {
        setIsModalOpen(false);
    };

    const enableModal = () => {
        setIsModalOpen(true);
    };

    const handleActiveTab = (n) => {
        // console.log('activeTab: ', n);
        setActiveTab(n);
    };

    return (
        <div id='Blog'>
            <div className='blog-wrapper'>
                <BlogUserInfo userId={userId} isOwnBlog={isOwnBlog} blogOwnerData={blogOwnerData} />
                <div className='blog-wrapper-area'>
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
                            ref={postsTabBtnRef}
                            className={activeTab === 2 ? 'article active' : 'article'}
                            onClick={() => handleActiveTab(2)}
                            aria-label='posts'
                            title='posts'
                        >
                            <img
                                src='/img/icon-edit.svg'
                                alt='posts'
                                style={{ width: 30, height: 30, display: 'block' }}
                            />
                        </button>
                        <button
                            type='button'
                            ref={playListTabBtnRef}
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
                        {activeTab === 2 && <BlogPosts />}
                        {activeTab === 3 && <BlogPlaylist userId={userId} isOwnBlog={isOwnBlog} />}
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
