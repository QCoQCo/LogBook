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
        console.log(userData);
        setUser(userData.find((user) => user.userId === userId));

        console.log('user info: ', userId, user);
        if (user) {
            console.log('user introduction: ', user.introduction);
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
                <div className='user-introduction'>
                    <textarea
                        ref={introTextRef}
                        onChange={handleChangeIntroText}
                        value={introText}
                    ></textarea>
                </div>
            </div>
        );
    }
};

export default BlogUserInfo;
