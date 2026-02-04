import React, { useState } from 'react';
import apiClient from '../../utils/apiClient';
import './FindAccountModal.scss';

const FindAccountModal = ({ isOpen, onClose, onToLogin }) => {
    const [activeTab, setActiveTab] = useState('findId'); // 'findId' or 'resetPw'

    // Find ID States
    const [findIdEmail, setFindIdEmail] = useState('');
    const [findIdNick, setFindIdNick] = useState('');
    const [foundId, setFoundId] = useState('');
    const [findIdError, setFindIdError] = useState('');

    // Reset PW States
    const [step, setStep] = useState(1); // 1: Verify, 2: Reset
    const [resetId, setResetId] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [resetNick, setResetNick] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [resetError, setResetError] = useState('');

    // Common
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    // --- Handlers for Find ID ---
    const handleFindId = async (e) => {
        e.preventDefault();
        setFindIdError('');
        setFoundId('');

        if (!findIdEmail) {
            setFindIdError('이메일을 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await apiClient.post('/auth/find-id', {
                email: findIdEmail
            });
            setFoundId(res.data.loginId);
        } catch (err) {
            setFindIdError(err.response?.data?.message || '사용자 정보를 찾을 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handlers for Reset PW ---
    const handleVerifyUser = async (e) => {
        e.preventDefault();
        setResetError('');

        if (!resetId || !resetEmail || !resetNick) {
            setResetError('모든 정보를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.post('/auth/verify-user', {
                loginId: resetId,
                email: resetEmail,
                nickName: resetNick
            });
            setStep(2); // Move to password input step
        } catch (err) {
            setResetError(err.response?.data?.message || '사용자 정보를 찾을 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPw = async (e) => {
        e.preventDefault();
        setResetError('');

        if (!newPw || !confirmPw) {
            setResetError('새 비밀번호를 입력해주세요.');
            return;
        }
        if (newPw !== confirmPw) {
            setResetError('비밀번호가 일치하지 않습니다.');
            return;
        }

        // 비밀번호 규칙 검사 (SignUp과 동일)
        const passwordRegex = /^(?=.{8,20}$)(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])(?!.*\s).+$/;
        if (!passwordRegex.test(newPw)) {
            setResetError('8~20자, 영문/숫자/특수문자 포함 필수.');
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.post('/auth/reset-password', {
                loginId: resetId,
                email: resetEmail,
                nickName: resetNick,
                newPassword: newPw
            });
            alert('비밀번호가 재설정되었습니다. 로그인해주세요.');
            handleClose();
            onToLogin(); // Open Login Modal
        } catch (err) {
            setResetError(err.response?.data?.message || '비밀번호 재설정에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset all states
        setActiveTab('findId');
        setFoundId('');
        setFindIdError('');
        setStep(1);
        setResetError('');
        setFindIdEmail(''); setFindIdNick('');
        setResetId(''); setResetEmail(''); setResetNick('');
        setNewPw(''); setConfirmPw('');
        onClose();
    };

    return (
        <div className="find-account-modal-overlay" onClick={handleClose}>
            <div className="find-account-modal" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={handleClose}>&times;</button>


                <div className="tabs">
                    <button
                        className={activeTab === 'findId' ? 'active' : ''}
                        onClick={() => setActiveTab('findId')}
                    >
                        아이디 찾기
                    </button>
                    <button
                        className={activeTab === 'resetPw' ? 'active' : ''}
                        onClick={() => setActiveTab('resetPw')}
                    >
                        비밀번호 찾기
                    </button>
                </div>

                <div className="tab-content">
                    {/* --- Find ID Tab --- */}
                    {activeTab === 'findId' && (
                        <div className="find-id-section">
                            {foundId ? (
                                <div className="result-view">
                                    <h3>회원님의 아이디는</h3>
                                    <p className="found-id">{foundId}</p>
                                    <h3>입니다.</h3>
                                    <div className="btn-group" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <button className="login-btn" style={{ flex: 1, margin: 0 }} onClick={() => { handleClose(); onToLogin(); }}>
                                            로그인 하러 가기
                                        </button>
                                        <button className="submit-btn" style={{ flex: 1, margin: 0, backgroundColor: '#666' }} onClick={() => {
                                            setActiveTab('resetPw');
                                            setResetId(foundId);
                                            setResetEmail(findIdEmail); // 입력했던 이메일 자동완성
                                            setStep(1); // 검증 단계부터 시작 (하지만 ID/Email은 채워짐)
                                        }}>
                                            비밀번호 찾기
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleFindId}>
                                    <div className="form-group">
                                        <label>이메일</label>
                                        <input
                                            type="email"
                                            value={findIdEmail}
                                            onChange={(e) => setFindIdEmail(e.target.value)}
                                            placeholder="가입 시 이메일"
                                        />
                                    </div>
                                    {findIdError && <p className="error-msg">{findIdError}</p>}
                                    <button type="submit" className="submit-btn" disabled={isLoading}>
                                        {isLoading ? '확인 중...' : '아이디 찾기'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}

                    {/* --- Reset PW Tab --- */}
                    {activeTab === 'resetPw' && (
                        <div className="reset-pw-section">
                            {step === 1 ? (
                                <form onSubmit={handleVerifyUser}>
                                    <div className="form-group">
                                        <label>아이디</label>
                                        <input
                                            type="text"
                                            value={resetId}
                                            onChange={(e) => setResetId(e.target.value)}
                                            placeholder="아이디"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>이메일</label>
                                        <input
                                            type="email"
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            placeholder="이메일"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>닉네임</label>
                                        <input
                                            type="text"
                                            value={resetNick}
                                            onChange={(e) => setResetNick(e.target.value)}
                                            placeholder="닉네임"
                                        />
                                    </div>
                                    {resetError && <p className="error-msg">{resetError}</p>}
                                    <button type="submit" className="submit-btn" disabled={isLoading}>
                                        {isLoading ? '확인 중...' : '다음'}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleResetPw}>
                                    <div className="info-msg">
                                        사용자 확인이 완료되었습니다.<br />
                                        새로운 비밀번호를 입력해주세요.
                                    </div>
                                    <div className="form-group">
                                        <label>새 비밀번호</label>
                                        <input
                                            type="password"
                                            value={newPw}
                                            onChange={(e) => setNewPw(e.target.value)}
                                            placeholder="8~20자, 영문/숫자/특수문자"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>비밀번호 확인</label>
                                        <input
                                            type="password"
                                            value={confirmPw}
                                            onChange={(e) => setConfirmPw(e.target.value)}
                                            placeholder="비밀번호 재입력"
                                        />
                                    </div>
                                    {resetError && <p className="error-msg">{resetError}</p>}
                                    <button type="submit" className="submit-btn" disabled={isLoading}>
                                        {isLoading ? '변경 중...' : '비밀번호 변경'}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FindAccountModal;
