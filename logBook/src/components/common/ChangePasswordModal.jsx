import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, useUI } from '../../context';
import apiClient from '../../utils/apiClient';
import './ChangePasswordModal.scss';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useUI(); // Toast 알림 사용 (Context에 있다면)

    // 로컬 상태
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // SignUp.jsx와 동일한 정규식
    const passwordRegex = /^(?=.{8,20}$)(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])(?!.*\s).+$/;

    useEffect(() => {
        if (isOpen) {
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 1. 유효성 검사
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!passwordRegex.test(newPassword)) {
            setError('비밀번호는 8~20자이며, 영문/숫자/특수문자를 포함해야 합니다.');
            return;
        }

        // 2. API 호출
        setIsLoading(true);
        try {
            await apiClient.post('/auth/change-password', {
                userId: currentUser.id.toString(),
                oldPassword,
                newPassword
            });

            // 성공 처리
            alert('비밀번호가 성공적으로 변경되었습니다.\n다시 로그인해주세요.');
            handleClose();
            logout(); // 로그아웃 처리
            navigate('/'); // 메인으로 이동
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || '비밀번호 변경에 실패했습니다.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
        setIsLoading(false);
        onClose();
    };

    return (
        <div className="change-pw-modal-overlay" onClick={handleClose}>
            <div className="change-pw-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>비밀번호 변경</h2>
                    <button className="close-btn" onClick={handleClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>현재 비밀번호</label>
                            <input
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="현재 비밀번호"
                            />
                        </div>
                        <div className="form-group">
                            <label>새 비밀번호</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="8~20자, 영문/숫자/특수문자 포함"
                            />
                            {newPassword && !passwordRegex.test(newPassword) && (
                                <p className="rule-hint">
                                    * 8~20자, 영문/숫자/특수문자 포함, 공백 불가
                                </p>
                            )}
                        </div>
                        <div className="form-group">
                            <label>새 비밀번호 확인</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="새 비밀번호 확인"
                            />
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="error-text">비밀번호가 일치하지 않습니다.</p>
                            )}
                        </div>

                        {error && <p className="error-msg">{error}</p>}

                        <div className="modal-footer">
                            <button type="button" className="cancel-btn" onClick={handleClose}>취소</button>
                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? '변경 중...' : '변경하기'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
