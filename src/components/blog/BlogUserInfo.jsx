import { useLogBook } from '../../context/LogBookContext';
import { useEffect, useRef, useState } from 'react';

const BlogUserInfo = ({ userId }) => {
    const [introText, setIntroText] = useState('');
    const [user, setUser] = useState(null);
    const introTextRef = useRef();
    const { userData } = useLogBook();

    const handleChangeIntroText = (e) => {
        setIntroText(e.target.value);
    };

    useEffect(() => {
        setUser(userData.find((user) => user.userId === userId));

        if (user) {
            setIntroText(user.introduction);
        }
    }, [userId, userData, user]);

    if (!user) {
        return null;
    } else {
        return (
            <div className='user-info-area'>
                <div className='profile-photo'>
                    <img id='user-profile-photo' src={user.profilePhoto} alt='' />
                </div>
                <button className='edit-profile-photo'>
                    <img src='/img/logbook-edit.png' />
                </button>
                <div className='user-introduction'>
                    <textarea
                        ref={introTextRef}
                        onChange={handleChangeIntroText}
                        value={introText}
                    ></textarea>
                </div>
                <div className='user-info-btns'>
                    <button className='save-btn'>저 장</button>
                    <button className='cancel-btn'>취 소</button>
                </div>
            </div>
        );
    }
};

export default BlogUserInfo;
