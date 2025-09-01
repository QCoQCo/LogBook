// MyPage.jsx
import { BlogFloatingUi, BlogGridLayout, BlogUserInfo } from '../blog';
import { useLogBook } from '../../context/LogBookContext';
import { useState } from 'react';
import BlogElementModal from '../blog/BlogElementModal';

import './MyPage.scss';

const MyPage = () => {
    const { clickedItem } = useLogBook();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const releaseModal = () => {
        setIsModalOpen(false);
    };

    const enableModal = () => {
        setIsModalOpen(true);
    };

    return (
        <div id='MyPage'>
            <div className='mypage-wrapper'>
                <BlogUserInfo />
                <BlogGridLayout enableModal={enableModal} />
            </div>
            {isModalOpen && (
                <div className='modal-overlay' onClick={releaseModal}>
                    <BlogElementModal item={clickedItem} releaseModal={releaseModal} />
                </div>
            )}
            <BlogFloatingUi />
        </div>
    );
};

export default MyPage;
