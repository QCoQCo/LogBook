import { useLogBook, useAuth } from '../../context/LogBookContext';
import { useEffect, useRef, useState } from 'react';

const BlogUserInfo = ({ userId }) => {
    const [isOwnBlog, setIsOwnBlog] = useState(false);
    const [introText, setIntroText] = useState('');
    const [user, setUser] = useState(null);
    const introTextRef = useRef();
    const { userData, isBlogEditting, setIsBlogEditting, getUserInfo } = useLogBook();
    const { currentUser, isLogin } = useAuth();

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
        setUser(userData.find((user) => user.userId === userId));
        const currentUserInfo =
            isLogin && currentUser ? getUserInfo(currentUser.id, currentUser.nickName) : null;

        if (currentUserInfo) {
            if (currentUserInfo.userId === userId) {
                setIsOwnBlog(true);
            } else {
                setIsOwnBlog(false);
            }
        } else {
            setIsOwnBlog(false);
        }

        if (user) {
            setIntroText(user.introduction);
        }
    }, [userId, userData, user]);

    if (!user) {
        return null;
    } else {
        return (
            <div className='user-info-area'>
                <div className='profile-photo-wrapper'>
                    <div className='profile-photo'>
                        <img id='user-profile-photo' src={user.profilePhoto} alt='' />
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
                {isBlogEditting && (
                    <div className='user-info-btns'>
                        <button className='save-btn' onClick={handleClickConfirmBtn}>
                            저 장
                        </button>
                        <button className='cancel-btn' onClick={handleClickCancelBtn}>
                            취 소
                        </button>
                    </div>
                )}
                {!isBlogEditting && isOwnBlog && (
                    <button className='edit-btn' onClick={handleClickEditBlog}>
                        내 블로그 수정하기
                    </button>
                )}
            </div>
        );
    }
};

export default BlogUserInfo;
