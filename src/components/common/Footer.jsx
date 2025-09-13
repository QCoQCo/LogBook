import { Link } from 'react-router-dom';
import { useUI } from '../../context';
import './Footer.scss';

const Footer = () => {
    const { isChatPage } = useUI(); // 다크모드 상태 구독

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
                            <div className='skull'>
                                <p>🏴‍☠️</p>
                                <p>☠️</p>
                                <p>🔥</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 추가된 푸터 내용 */}
                <div className='middle'>
                    <div className='footer-sections'>
                        <div className='section'>
                            <h4>서비스</h4>
                            <ul>
                                <li>
                                    <Link to='/blog'>블로그</Link>
                                </li>
                                <li>
                                    <Link to='/chat'>채팅</Link>
                                </li>
                                <li>
                                    <Link to='/playlist'>플레이리스트</Link>
                                </li>
                                <li>
                                    <Link to='/feed'>피드</Link>
                                </li>
                            </ul>
                        </div>
                        <div className='section'>
                            <h4>지원</h4>
                            <ul>
                                <li>
                                    <Link to='https://github.com/QCoQCo/LogBook'>고객센터</Link>
                                </li>
                                <li>
                                    <Link to='https://github.com/QCoQCo/LogBook'>FAQ</Link>
                                </li>
                                <li>
                                    <Link to='https://github.com/QCoQCo/LogBook'>문의하기</Link>
                                </li>
                                <li>
                                    <Link to='https://github.com/QCoQCo/LogBook'>업데이트</Link>
                                </li>
                            </ul>
                        </div>
                        <div className='section'>
                            <h4>LogBook</h4>
                            <ul>
                                <li>
                                    <Link to='/'>프로젝트 소개</Link>
                                </li>
                                <li>
                                    <Link to='https://github.com/QCoQCo/LogBook'>기여하기</Link>
                                </li>
                            </ul>
                        </div>
                        <div className='section'>
                            <h4>소셜</h4>
                            <ul>
                                <li>
                                    <Link to='https://github.com/QCoQCo/LogBook'>GitHub</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className='bottom'>
                    <div className='contact-info'>
                        <p>📧 contact@logbook.com</p>
                        <p>📞 010-1234-5678</p>
                        <p>📍 대한민국 부산광역시</p>
                    </div>
                    <div className='tech-stack'>
                        <p>Built with React, Firebase, BACKEND & Love ❤️</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
