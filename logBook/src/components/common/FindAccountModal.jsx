import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../../utils/apiClient';
import './FindAccountModal.scss';

const FindAccountModal = ({ isOpen, onClose, onToLogin }) => {
    const [activeTab, setActiveTab] = useState('findId'); // 'findId' or 'resetPw'

    // Find ID States
    const [findIdEmail, setFindIdEmail] = useState('');
    const [foundId, setFoundId] = useState('');
    const [findIdError, setFindIdError] = useState('');

    // Reset PW States
    // Step 1: User Verify, Step 2: Email Verify, Step 3: Reset PW
    const [step, setStep] = useState(1);
    const [resetId, setResetId] = useState('');
    const [resetEmail, setResetEmail] = useState('');

    // Step 2: Email Auth States
    const [authCode, setAuthCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [timer, setTimer] = useState(0);
    const timerRef = useRef(null);
    const [verificationToken, setVerificationToken] = useState('');

    // Step 3: New Password States
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [resetError, setResetError] = useState('');

    // Common
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

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

    // Step 1: Verify User Info
    const handleVerifyUser = async (e) => {
        e.preventDefault();
        setResetError('');

        if (!resetId || !resetEmail) {
            setResetError('모든 정보를 입력해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.post('/auth/verify-user', {
                loginId: resetId,
                email: resetEmail
            });
            setStep(2); // Move to Email Verification
        } catch (err) {
            setResetError(err.response?.data?.message || '사용자 정보를 찾을 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Email Verification
    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimer(600); // 10분 = 600초 (사용자 요청 반영)
        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleSendEmail = async () => {
        setResetError('');
        if (!resetEmail) {
            setResetError('이메일 정보가 없습니다.');
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.post('/auth/email/send', { email: resetEmail });
            setIsCodeSent(true);
            startTimer();
            alert('인증 코드가 전송되었습니다. 이메일을 확인해주세요.');
        } catch (err) {
            setResetError(err.response?.data?.message || '이메일 전송 실패.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        setResetError('');
        if (!authCode) {
            alert('인증 코드를 입력하세요.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await apiClient.post('/auth/email/verify', {
                email: resetEmail,
                code: authCode
            });

            if (res.data.token) {
                setVerificationToken(res.data.token);
                if (timerRef.current) clearInterval(timerRef.current);
                setStep(3); // Move to New Password Input
            } else {
                // Should not happen if success
                setResetError('인증 토큰을 발급받지 못했습니다.');
            }
        } catch (err) {
            setResetError(err.response?.data?.message || '인증 코드가 올바르지 않거나 만료되었습니다.');
        } finally {
            setIsLoading(false);
        }
    };


    // Step 3: Reset Password
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

        if (!verificationToken) {
            setResetError('인증 세션이 만료되었습니다. 처음부터 다시 시도해주세요.');
            return;
        }

        setIsLoading(true);
        try {
            await apiClient.post('/auth/reset-password', {
                loginId: resetId,
                email: resetEmail,
                newPassword: newPw,
                verificationToken: verificationToken // New Field
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
        setFindIdEmail('');

        setResetId(''); setResetEmail('');
        setAuthCode(''); setIsCodeSent(false); setTimer(0);
        if (timerRef.current) clearInterval(timerRef.current);
        setVerificationToken('');

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
                            {/* Step 1: User Info */}
                            {step === 1 && (
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
                                    {resetError && <p className="error-msg">{resetError}</p>}
                                    <button type="submit" className="submit-btn" disabled={isLoading}>
                                        {isLoading ? '확인 중...' : '다음'}
                                    </button>
                                </form>
                            )}

                            {/* Step 2: Email Auth (New) */}
                            {step === 2 && (
                                <div>
                                    <div className="info-msg" style={{ marginBottom: '20px' }}>
                                        회원 정보가 확인되었습니다.<br />
                                        이메일 인증을 진행해주세요.
                                    </div>

                                    <div className="form-group">
                                        <label>이메일 인증</label>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                type="email"
                                                value={resetEmail}
                                                disabled
                                                style={{ flex: 1, backgroundColor: '#f0f0f0' }}
                                            />
                                            <button
                                                type="button"
                                                className="check-btn"
                                                style={{ width: '100px', height: '40px', padding: 0 }}
                                                onClick={handleSendEmail}
                                                disabled={isCodeSent || isLoading}
                                            >
                                                {isCodeSent ? '전송됨' : '인증번호 전송'}
                                            </button>
                                        </div>
                                    </div>

                                    {isCodeSent && (
                                        <div className="form-group">
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    placeholder="인증코드 6자리"
                                                    value={authCode}
                                                    onChange={(e) => setAuthCode(e.target.value)}
                                                    maxLength={6}
                                                    style={{ flex: 1 }}
                                                />
                                                <span style={{ color: 'red', fontWeight: 'bold', minWidth: '50px', textAlign: 'center' }}>
                                                    {formatTime(timer)}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="submit-btn"
                                                style={{ marginTop: '10px' }}
                                                onClick={handleVerifyCode}
                                                disabled={timer === 0 || isLoading}
                                            >
                                                {isLoading ? '확인 중...' : '인증 확인'}
                                            </button>
                                        </div>
                                    )}

                                    {resetError && <p className="error-msg">{resetError}</p>}
                                </div>
                            )}

                            {/* Step 3: New Password */}
                            {step === 3 && (
                                <form onSubmit={handleResetPw}>
                                    <div className="info-msg">
                                        이메일 인증이 완료되었습니다.<br />
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
