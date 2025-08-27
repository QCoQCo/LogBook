import { Link } from 'react-router-dom';
import { useLogBook } from '../../context/LogBookContext';
import './Footer.scss';

const Footer = () => {
    const { isChatPage } = useLogBook(); // 다크모드 상태 구독

    return (
        <footer id='Footer' className={isChatPage ? 'dark-mode' : ''}>
            <div className='container'>
                <div className='top'>
                    <div className='icons'>
                        <div className='logo'></div>
                        <div className='title'></div>
                    </div>
                    <div className='terms'>
                        <div className='left'>
                            <p>Copyright 2025. LogBook. All rights reserved.</p>
                        </div>
                        <div className='right'>
                            <p>
                                <Link to=''>개인정보처리방침</Link>
                            </p>
                            <p>
                                <Link to=''>이용약관</Link>
                            </p>
                            <p className='skull'>🔥☠️🔥</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
