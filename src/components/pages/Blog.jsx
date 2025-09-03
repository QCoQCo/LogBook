// Blog.jsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLogBook } from '../../context/LogBookContext';
import { BlogFloatingUi, BlogGridLayout, BlogUserInfo } from '../blog';
import BlogElementModal from '../blog/BlogElementModal';

import './Blog.scss';

const Blog = () => {
    // 블로그 페이지의 userId 파라미터
    const [searchParam] = useSearchParams();
    const userId = searchParam.get('userId');

    // 현재 클릭한 element 정보를 전달받기 위한 context의 State
    const { clickedItem, isBlogEditting, getUserInfo } = useLogBook();
    // Modal 상태 관리
    const [isModalOpen, setIsModalOpen] = useState(false);

    const releaseModal = () => {
        setIsModalOpen(false);
    };

    const enableModal = () => {
        setIsModalOpen(true);
    };

    return (
        <div id='Blog'>
            <div className='blog-wrapper'>
                <BlogUserInfo userId={userId} />
                <BlogGridLayout userId={userId} enableModal={enableModal} />
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
