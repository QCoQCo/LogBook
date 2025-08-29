// MyPage.jsx
import { BlogFloatingUi, BlogGridLayout, BlogUserInfo } from '../blog';
import { useLogBook } from '../../context/LogBookContext';
import { useState } from 'react';
import BlogElementModal from '../blog/BlogElementModal';

import './MyPage.scss';

const MyPage = () => {
    const { clickedItem } = useLogBook();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const dismissModal = () => {
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
            {isModalOpen && <BlogElementModal item={clickedItem} dismissModal={dismissModal} />}
            <BlogFloatingUi />
        </div>
    );
};

export default MyPage;
