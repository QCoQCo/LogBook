import { BlogFloatingUi, BlogGridLayout, BlogUserInfo } from '../blog';

import './MyPage.scss';

const MyPage = () => {
    return (
        <div id='MyPage'>
            <div className='mypage-wrapper'>
                <BlogUserInfo />
                <BlogGridLayout />
            </div>
            <BlogFloatingUi />
        </div>
    );
};

export default MyPage;
