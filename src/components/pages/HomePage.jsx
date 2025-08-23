import { Link } from 'react-router-dom';
import './HomePage.scss';

const HomePage = () => {
    return (
        <div id='HomePage'>
            <div className='container'>
                <p>
                    <Link to='/chat'>Chat</Link>
                </p>
                <p>
                    <Link to='/myPage'>Mypage</Link>
                </p>
            </div>
        </div>
    );
};

export default HomePage;
