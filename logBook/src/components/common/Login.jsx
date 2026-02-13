import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import './Login.scss';
import { loginClient } from '../../utils/auth';
import { useAuth } from '../../context';
import apiClient from '../../utils/apiClient';

const Login = ({ onClose = () => {}, onFindAccount = () => {} }) => {
    const { login } = useAuth();

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        // auth channel/migration are handled by AuthProvider; only modal key/overflow here
        document.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    const navigate = useNavigate();
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleGoogleLogin = () => {
        window.location.href = '/api/oauth2/authorization/google';
    };

    const handleKakaoLogin = () => {
        window.location.href = '/api/oauth2/authorization/kakao';
    };

    const handleNaverLogin = () => {
        window.location.href = '/api/oauth2/authorization/naver';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 유효성 검사
        if (!userId.trim() || !password) {
            setError('ID와 비밀번호를 입력해주세요.');
            return;
        }

        try {
            // [백엔드 API 호출 - apiClient 사용]
            const response = await apiClient.post('/auth/login', {
                loginId: userId,
                password: password,
            });

            if (response.status === 200) {
                const { token, user } = response.data; // apiClient는 response.data에 결과가 담김

                // Context에 저장할 데이터 구성
                const payload = {
                    ...user,
                    token: token,
                };

                // 로그인 처리 (Context + LocalStorage 저장)
                login(payload, true);
                onClose();
                navigate(`/blog?userId=${user.loginId}`);
            } else {
                setError('아이디 또는 비밀번호가 일치하지 않습니다.');
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 401) {
                setError('아이디 또는 비밀번호가 일치하지 않습니다.');
            } else {
                setError('로그인 중 문제가 발생했습니다.');
            }
        }
    };

    const modal = (
        <div className="lb-login-backdrop" onClick={onClose}>
            <div
                className="lb-login-modal"
                role="dialog"
                aria-modal="true"
                aria-label="로그인"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="lb-close" aria-label="닫기" onClick={onClose}>
                    ×
                </button>
                <h2 className="lb-title">로그인</h2>
                <form className="lb-form" onSubmit={handleSubmit}>
                    <label className="lb-label">
                        ID
                        <input
                            name="input-id"
                            type="text"
                            required
                            value={userId}
                            onChange={(e) => setUserId(e.target.value.toLowerCase())}
                        />
                    </label>
                    <label className="lb-label">
                        비밀번호
                        <input
                            name="input-password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                    {error && (
                        <div className="lb-error" role="alert" aria-live="assertive">
                            {error}
                        </div>
                    )}
                    <button type="submit" className="lb-submit">
                        로그인
                    </button>
                    <div className="lb-sign-info">
                        <div className="lb-signup">
                            <Link to="/signUp" onClick={onClose}>
                                회원가입
                            </Link>
                        </div>
                        <div className="lb-find-id-pw">
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onFindAccount();
                                }}
                            >
                                아이디/비밀번호 찾기
                            </a>
                        </div>
                    </div>
                    <div className="lb-divider">
                        <span>또는</span>
                    </div>
                    <div className="social-btn-wrapper">
                        <button className="social-btn google-btn" onClick={handleGoogleLogin}>
                            <img
                                src="https://developers.google.com/identity/images/g-logo.png"
                                alt="Google"
                            />
                        </button>
                        <button className="social-btn kakao-btn" onClick={handleKakaoLogin}>
                            <svg
                                version="1.1"
                                id="Layer_1"
                                xmlns="http://www.w3.org/2000/svg"
                                xmlnsXlink="http://www.w3.org/1999/xlink"
                                x="0px"
                                y="0px"
                                viewBox="0 0 2500 2500"
                                style={{ enableBackground: 'new 0 0 2500 2500' }}
                                xmlSpace="preserve"
                            >
                                <path style={{ fill: '#FFE812' }} d="M2500,0v2500H0V0H2500z" />
                                <path
                                    d="M1250,351.6c-560.9,0-1015.6,358.5-1015.6,800.8c0,285.9,190.1,536.8,476.1,678.5c-15.6,53.7-100,345.2-103.3,368.1
  c0,0-2,17.2,9.1,23.8c11.1,6.6,24.2,1.5,24.2,1.5c32-4.5,370.5-242.3,429.1-283.6c58.5,8.3,118.8,12.6,180.4,12.6
  c560.9,0,1015.6-358.5,1015.6-800.8C2265.6,710.1,1810.9,351.6,1250,351.6L1250,351.6z"
                                />
                                <path
                                    style={{ fill: '#FFE812' }}
                                    d="M688.5,1431.9c-32.3,0-58.6-25.1-58.6-56v-348.1h-91.4c-31.7,0-57.5-25.7-57.5-57.4s25.8-57.4,57.5-57.4h300
  c31.7,0,57.5,25.7,57.5,57.4s-25.8,57.4-57.5,57.4h-91.4v348.1C747.1,1406.8,720.8,1431.9,688.5,1431.9z M1202.3,1431.1
  c-24.4,0-43.1-9.9-48.8-25.9l-29-76l-178.7,0l-29,76c-5.6,15.9-24.3,25.8-48.7,25.8c-12.9,0-25.6-2.7-37.2-8.1
  c-16.2-7.5-31.7-27.9-13.9-83.2l140.2-368.9c9.9-28.1,39.9-57,78-57.8c38.3,0.9,68.3,29.8,78.2,57.9l140.1,368.7
  c17.8,55.4,2.3,75.9-13.8,83.3C1227.8,1428.4,1215.1,1431.1,1202.3,1431.1C1202.3,1431.1,1202.3,1431.1,1202.3,1431.1L1202.3,1431.1
  z M1093.7,1225.5l-58.5-166.3l-58.5,166.3H1093.7L1093.7,1225.5z M1347.7,1423.3c-31,0-56.2-24.1-56.2-53.7V971.7
  c0-32.3,26.8-58.6,59.8-58.6s59.8,26.3,59.8,58.6v344.2h124.5c31,0,56.2,24.1,56.2,53.7s-25.2,53.7-56.2,53.7H1347.7z
   M1673.2,1431.1c-32.3,0-58.6-26.3-58.6-58.6V971.7c0-32.3,26.3-58.6,58.6-58.6s58.6,26.3,58.6,58.6v125.9l163.5-163.5
  c8.4-8.4,20-13,32.5-13c14.6,0,29.3,6.3,40.3,17.3c10.3,10.3,16.4,23.4,17.2,37.1c0.8,13.8-3.8,26.5-12.9,35.7l-133.5,133.5
  l144.2,191.1c9.4,12.4,13.5,28,11.2,43.4c-2.1,15.4-10.3,29.3-22.7,38.6c-10.1,7.7-22.5,11.9-35.2,11.8
  c-18.4,0.1-35.8-8.6-46.8-23.3l-137.4-182.1l-20.3,20.3v127.8C1731.8,1404.9,1705.5,1431.1,1673.2,1431.1L1673.2,1431.1z"
                                />
                            </svg>
                        </button>
                        <button className="social-btn naver-btn" onClick={handleNaverLogin}>
                            <div className="naver-icon-wrapper">
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z"
                                        fill="white"
                                    />
                                </svg>
                            </div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modal, document.body);
};

export default Login;
