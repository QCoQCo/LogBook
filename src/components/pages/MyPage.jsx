// MyPage.jsx
import { BlogFloatingUi, BlogGridLayout, BlogUserInfo } from '../blog';
import { useLogBook } from '../../context/LogBookContext';
import { useRef } from 'react';
import BlogElementModal from '../blog/BlogElementModal';

import './MyPage.scss';

const MyPage = () => {
    const { clickedItem } = useLogBook();

    const modalRef = useRef();

    const handleClickConfirm = () => {
        console.log('confirm');
        modalRef.current.style.display = 'none';
    };

    const handleClickCancel = () => {
        console.log('cancel');
        modalRef.current.style.display = 'none';
    };

    const enableModal = () => {
        modalRef.current.style.display = 'block';
    };

    return (
        <div id='MyPage'>
            <div className='mypage-wrapper'>
                <BlogUserInfo />
                <BlogGridLayout enableModal={enableModal} />
            </div>
            <BlogElementModal
                item={clickedItem}
                handleClickConfirm={handleClickConfirm}
                handleClickCancel={handleClickCancel}
                ref={modalRef}
            />
            <BlogFloatingUi />
        </div>
    );
};

export default MyPage;
