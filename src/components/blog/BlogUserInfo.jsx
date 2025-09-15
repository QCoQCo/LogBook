import { useBlog } from '../../context';
import { useEffect, useRef, useState } from 'react';

const BlogUserInfo = ({ userId, blogOwnerData, isOwnBlog }) => {
    const [introText, setIntroText] = useState('');

    const introTextRef = useRef();

    // useContext
    const { isBlogEditting, setIsBlogEditting, activeTab } = useBlog();

    const handleChangeIntroText = (e) => {
        setIntroText(e.target.value);
    };

    const handleClickEditBlog = () => {
        setIsBlogEditting(true);
    };

    const handleClickConfirmBtn = () => {
        setIsBlogEditting(false);
    };

    const handleClickCancelBtn = () => {
        setIsBlogEditting(false);
    };

    useEffect(() => {
        setIsBlogEditting(false);
    }, []);

    useEffect(() => {
        if (blogOwnerData) {
            setIntroText(blogOwnerData.introduction);
        }
    }, [blogOwnerData]);

    if (!blogOwnerData) {
        return null;
    } else {
        return (
            <div className='user-info-area'>
                <div className='profile-photo-wrapper'>
                    <div className='profile-photo'>
                        <img
                            id='user-profile-photo'
                            src={blogOwnerData.profilePhoto || '/img/userProfile-ex.png'}
                            alt=''
                        />
                    </div>
                </div>
                {isBlogEditting && (
                    <button className='edit-profile-photo'>
                        <img src='/img/logbook-edit.png' />
                    </button>
                )}
                <div
                    className={
                        isBlogEditting
                            ? 'user-introduction is-editting'
                            : isOwnBlog
                            ? 'user-introduction is-my-blog'
                            : 'user-introduction'
                    }
                >
                    <textarea
                        ref={introTextRef}
                        onChange={handleChangeIntroText}
                        value={introText}
                        readOnly={isBlogEditting ? '' : 'readonly'}
                    ></textarea>
                </div>
                {isBlogEditting && activeTab === 1 && (
                    <div className='user-info-btns'>
                        <button className='save-btn' onClick={handleClickConfirmBtn}>
                            저 장
                        </button>
                        <button className='cancel-btn' onClick={handleClickCancelBtn}>
                            취 소
                        </button>
                    </div>
                )}
                {!isBlogEditting && isOwnBlog && activeTab === 1 && (
                    <button className='edit-btn' onClick={handleClickEditBlog}>
                        내 블로그 수정하기
                    </button>
                )}
            </div>
        );
    }
};

export default BlogUserInfo;
