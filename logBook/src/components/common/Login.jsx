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
                            <div className="kakao-icon-wrapper">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                                    <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.558 1.707 4.8 4.34 6.054l-.85 3.107c-.053.197.067.4.264.45s.4-.067.45-.264l1.1-4.025c.55.087 1.118.133 1.696.133 4.97 0 9-3.185 9-7.115S16.97 3 12 3z" />
                                </svg>
                            </div>
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
