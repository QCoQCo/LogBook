// Blog.jsx
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBlog, useAuth, useUserData } from '../../context';
import {
    BlogFloatingUi,
    BlogGridLayout,
    BlogUserInfo,
    BlogPosts,
    BlogPlaylist,
    BlogElementModal,
    ThemeModal,
} from '../blog';

import './Blog.scss';

const getTextColor = (hex) => {
    if (!hex) return '#333';

    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);

    // 밝기 계산 공식 (YIQ)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 160 ? '#333' : '#f2f2f2';
};

const Blog = () => {
    // 블로그 페이지의 userId 파라미터
    const [searchParam] = useSearchParams();
    const userId = searchParam.get('userId');

    // Blog, UserData Context 사용
    const { clickedItem, isBlogEditing, activeTab, setActiveTab, colorTheme, setColorTheme } =
        useBlog();
    const { currentUser, isLogin } = useAuth();

    // States
    const [isModalOpen, setIsModalOpen] = useState(false); // Modal 상태 관리
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false); // color picker modal 관리
    const [isOwnBlog, setIsOwnBlog] = useState(false); // 블로그 소유자 여부
    const [blogOwnerData, setBlogOwnerData] = useState(null); // 블로그 소유주 데이터

    // Refs
    const postsTabBtnRef = useRef(null);
    const playListTabBtnRef = useRef(null);

    // Blog color Theme
    const textColor = getTextColor(colorTheme);
    const isDarkTheme = getTextColor(colorTheme) === '#f2f2f2';

    const fetchBlogOwner = async () => {
        try {
            const response = await axios.get(`/api/users/${userId}`);
            setBlogOwnerData(response.data);
        } catch (error) {
            // 404 등 에러가 나면 여기로 옴
            setBlogOwnerData(null);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchBlogOwner();
        }
    }, [userId]);

    useEffect(() => {
        if (isLogin && currentUser) {
            setIsOwnBlog(String(currentUser.loginId) === String(userId));
        } else {
            setIsOwnBlog(false);
        }
    }, [userId, currentUser, isLogin]);

    useEffect(() => {
        if (isBlogEditing) {
            postsTabBtnRef.current.disabled = true;
            playListTabBtnRef.current.disabled = true;
        } else {
            postsTabBtnRef.current.disabled = false;
            playListTabBtnRef.current.disabled = false;
        }
    }, [isBlogEditing]);

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
        <div
            id="Blog"
            style={{
                '--theme-color': colorTheme,
                '--theme-text-color': textColor,
                '--icon-filter': isDarkTheme ? 'invert(1)' : 'none',
            }}
        >
            <div className="blog-wrapper">
                <BlogUserInfo
                    userId={userId}
                    isOwnBlog={isOwnBlog}
                    blogOwnerData={blogOwnerData}
                    onUpdate={fetchBlogOwner}
                />
                <div className="blog-wrapper-area">
                    <div className="blog-wrapper-tab">
                        {/* 왼쪽 영역 */}
                        <div className="tab-left">
                            {isOwnBlog && isBlogEditing && activeTab === 1 && (
                                <button
                                    type="button"
                                    className="theme-btn"
                                    onClick={() => setIsThemeModalOpen(true)}
                                    title="테마 변경"
                                >
                                    <img src="/img/icons8-color-picker-64.png" alt="color-picker" />
                                </button>
                            )}
                        </div>

                        {/* 오른쪽 영역 */}
                        <div className="tab-right">
                            <button
                                type="button"
                                className={activeTab === 1 ? 'home active' : 'home'}
                                onClick={() => handleActiveTab(1)}
                            >
                                <img src="/img/icon-home.svg" alt="home" width={30} height={30} />
                            </button>

                            <button
                                type="button"
                                ref={postsTabBtnRef}
                                className={activeTab === 2 ? 'article active' : 'article'}
                                onClick={() => handleActiveTab(2)}
                            >
                                <img src="/img/icon-edit.svg" alt="posts" width={30} height={30} />
                            </button>

                            <button
                                type="button"
                                ref={playListTabBtnRef}
                                className={activeTab === 3 ? 'playlist active' : 'playlist'}
                                onClick={() => handleActiveTab(3)}
                            >
                                <img
                                    src="/img/icon-playlist.svg"
                                    alt="playlist"
                                    width={30}
                                    height={30}
                                />
                            </button>
                        </div>
                    </div>
                    <div className="blog-wrapper-contents">
                        {activeTab === 1 && (
                            <BlogGridLayout userId={userId} enableModal={enableModal} />
                        )}
                        {activeTab === 2 && <BlogPosts blogOwnerData={blogOwnerData} />}
                        {activeTab === 3 && <BlogPlaylist userId={userId} isOwnBlog={isOwnBlog} />}
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <div className="modal-overlay" onClick={releaseModal}>
                    <BlogElementModal
                        item={clickedItem}
                        isBlogEditing={isBlogEditing}
                        releaseModal={releaseModal}
                    />
                </div>
            )}
            {isThemeModalOpen && (
                <ThemeModal
                    color={colorTheme}
                    setColor={setColorTheme}
                    onClose={() => setIsThemeModalOpen(false)}
                />
            )}
            {isBlogEditing && <BlogFloatingUi />}
        </div>
    );
};

export default Blog;
