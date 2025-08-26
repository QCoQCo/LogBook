import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import './login.scss';
import { loginClient } from '../../utils/auth';

const Login = ({ onClose = () => {}, handleLoginState }) => {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!userId.trim() || !password) {
            setError('ID와 비밀번호를 입력해주세요.');
            return;
        }

        try {
            const ok = await loginClient(userId, password);
            if (ok) {
                const usersJson = localStorage.getItem('logbook_users');
                const users = usersJson ? JSON.parse(usersJson) : [];
                const user = users.find((u) => u.id === userId);
                localStorage.setItem(
                    'logbook_current_user',
                    JSON.stringify({ id: user?.id, email: user?.email })
                );
                handleLoginState(true);
                onClose();
                navigate('/myPage');
            } else {
                setError('아이디 또는 비밀번호가 일치하지 않습니다.');
            }
        } catch (err) {
            console.error('로그인 처리 오류', err);
            setError('로그인 중 오류가 발생했습니다. 콘솔을 확인하세요.');
        }
    };

    const modal = (
        <div className='lb-login-backdrop' onClick={onClose}>
            <div
                className='lb-login-modal'
                role='dialog'
                aria-modal='true'
                aria-label='로그인'
                onClick={(e) => e.stopPropagation()}
            >
                <button className='lb-close' aria-label='닫기' onClick={onClose}>
                    ×
                </button>
                <h2 className='lb-title'>로그인</h2>
                <form className='lb-form' onSubmit={handleSubmit}>
                    <label className='lb-label'>
                        ID
                        <input
                            name='input-id'
                            type='text'
                            required
                            value={userId}
                            onChange={(e) => setUserId(e.target.value.toLowerCase())}
                        />
                    </label>
                    <label className='lb-label'>
                        비밀번호
                        <input
                            name='input-password'
                            type='password'
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                    {error && (
                        <div className='lb-error' role='alert' aria-live='assertive'>
                            {error}
                        </div>
                    )}
                    <button type='submit' className='lb-submit'>
                        로그인
                    </button>
                </form>
                <div className='lb-sign-info'>
                    <div className='lb-signup'>
                        <Link to='/signUp' onClick={onClose}>
                            회원가입
                        </Link>
                    </div>
                    <div className='lb-find-id-pw'>
                        <a href='#'>아이디/비밀번호 찾기</a>
                    </div>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modal, document.body);
};

export default Login;
