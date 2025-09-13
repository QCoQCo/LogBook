import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useUI } from '../../context';
import './ErrorPage.scss';

const ErrorPage = () => {
    const { setIsChatPage } = useUI();
    // LogBookIntro 페이지 진입 시 다크모드 활성화
    useEffect(() => {
        setIsChatPage(true);

        // LogBookIntro 이탈 시 다크모드 비활성화
        return () => {
            setIsChatPage(false);
        };
    }, [setIsChatPage]);
    return (
        <div id='ErrorPage'>
            <div className='animated-bg'>
                <div className='stars'></div>
                <div className='twinkling'></div>
                <div className='clouds'></div>
            </div>
            <div className='logo-wrapper'>
                <h1>ERROR</h1>
                <p className='error-logo'>
                    <img src='/img/error_logo.png' alt='error' />
                </p>
            </div>
            <div className='text-wrapper'>
                <h2>오류가 발생했습니다.</h2>
                <p>잠시 후 다시 시도해주세요.</p>
                <div className='button-wrapper'>
                    <Link to={-1}>이전 페이지로 돌아가기</Link>
                    <Link to='/'>홈으로 돌아가기</Link>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
