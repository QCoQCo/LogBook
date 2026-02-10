import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context';

const OAuth2RedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
            try {
                // JWT 디코딩하여 유저 정보 추출
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(atob(base64));

                // Context에 저장할 데이터 구성 (JwtTokenProvider에서 추가한 클레임 활용)
                const userPayload = {
                    id: payload.userId,
                    loginId: payload.sub,
                    userEmail: payload.email,
                    nickName: payload.nickName,
                    profilePhoto: payload.profilePhoto,
                    token: token,
                };

                // 로그인 처리 (persist=true로 LocalStorage에도 저장)
                login(userPayload, true);

                // 로그인 완료 후 메인 또는 블로그로 이동
                navigate('/');
            } catch (error) {
                console.error('인증 토큰 처리 중 오류 발생:', error);
                navigate('/error');
            }
        } else {
            navigate('/error');
        }
    }, [location, login, navigate]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <p>로그인 중입니다. 잠시만 기다려주세요...</p>
        </div>
    );
};

export default OAuth2RedirectHandler;
