import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import './login.scss';

const Login = ({ onClose = () => {} }) => {
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
                <form
                    className='lb-form'
                    onSubmit={(e) => {
                        e.preventDefault();
                        onClose();
                    }}
                >
                    <label className='lb-label'>
                        ID
                        <input name='input-id' type='text' required />
                    </label>
                    <label className='lb-label'>
                        비밀번호
                        <input name='input-password' type='password' required />
                    </label>
                    <button type='submit' className='lb-submit'>
                        로그인
                    </button>
                </form>
                <div className='lb-sign-info'>
                    <div className='lb-signup'>
                        <a href='#'>회원가입</a>
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
