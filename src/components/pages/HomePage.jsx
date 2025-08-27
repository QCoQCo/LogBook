import { Link } from 'react-router-dom';

import * as Common from '../common';
import './HomePage.scss';

const HomePage = () => {
    // quick client-side login detection using session/local storage key used elsewhere in the app
    let isLogin = false;
    try {
        const raw =
            sessionStorage.getItem('logbook_current_user') ||
            localStorage.getItem('logbook_current_user');
        isLogin = !!raw;
    } catch (e) {
        isLogin = false;
    }

    return (
        <div id='HomePage'>
            <div className='container'>
                <div className='links'>
                    <p>
                        <Link to='/chat'>Chat</Link>
                    </p>
                    <p>
                        <Link to='/myPage'>Mypage</Link>
                    </p>
                    <p>
                        <Link to='/playlist/1'>PlayListPage</Link>
                    </p>
                </div>
            </div>
            {isLogin && <Common.FloatingButton />}
        </div>
    );
};

export default HomePage;
