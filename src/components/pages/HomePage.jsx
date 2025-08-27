import { Link } from 'react-router-dom';

import * as Common from '../common';
import './HomePage.scss';
import { useAuth } from '../../context/LogBookContext';

const HomePage = () => {
    const { isLogin } = useAuth();

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
