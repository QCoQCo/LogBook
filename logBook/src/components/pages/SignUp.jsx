import { useState, useRef } from 'react';
import './SignUp.scss';
import { useNavigate } from 'react-router-dom';
import { signupClient } from '../../utils/auth';

const SignUp = () => {
    const navigate = new useNavigate();
    const [values, setValues] = useState({
        id: '',
        password: '',
        passwordConfirm: '',
        email: '',
        nickName: '',
    });

    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [isIdChecked, setIsIdChecked] = useState(false);
    const [isNickNameChecked, setIsNickNameChecked] = useState(false);

    const idRef = useRef(null);
    const pwRef = useRef(null);
    const pwConfirmRef = useRef(null);
    const emailRef = useRef(null);
    const nickNameRef = useRef(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.{8,20}$)(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])(?!.*\s).+$/;

    const validateField = (name, value) => {
        switch (name) {
            case 'id':
                if (!value.trim()) return 'ID를 입력하세요.';
                // 명확한 규칙으로 변경
                if (!/^[a-z0-9]{6,15}$/.test(value))
                    return '6~15자의 영문 소문자와 숫자만 사용 가능합니다.';
                if (!isIdChecked) return 'ID 중복 확인을 해주세요.';
                return '';
            case 'password':
                if (!value) return '비밀번호를 입력하세요.';
                if (!passwordRegex.test(value))
                    return '비밀번호는 8~20자이며, 영문자/숫자/특수문자를 각각 하나 이상 포함해야 하며 공백을 포함할 수 없습니다.';
                return '';
            case 'passwordConfirm':
                if (!value) return '비밀번호 확인을 입력하세요.';
                if (value !== values.password) return '비밀번호가 일치하지 않습니다.';
                return '';
            case 'email':
                if (value && !emailRegex.test(value)) return '유효한 이메일을 입력하세요.';
                return '';
            case 'nickName': // 닉네임 케이스도 확인
                if (!value.trim()) return '닉네임을 입력하세요.';
                if (value.length < 2) return '닉네임은 2글자 이상이어야 합니다.';
                if (!isNickNameChecked) return '닉네임 중복 확인을 해주세요.';
                return '';
            default:
                return '';
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = name === 'id' ? value.toLowerCase() : value;
        setValues((s) => ({ ...s, [name]: newValue }));
        setErrors((prev) => ({ ...prev, [name]: validateField(name, newValue) }));

        if (name === 'id') {
            setIsIdChecked(false);
        }
        // if password changed, re-validate confirm
        if (name === 'password' && values.passwordConfirm) {
            setErrors((prev) => ({
                ...prev,
                passwordConfirm: validateField('passwordConfirm', values.passwordConfirm),
            }));
        }
        if (name === 'nickName') {
            setIsNickNameChecked(false);
        }
    };

    const handleCheckId = async () => {
        if (!values.id.trim()) {
            setErrors(prev => ({ ...prev, id: 'ID를 입력하세요.' }));
            return;
        }
        // ID 유효성 검사 (길이, 문자 등)
        if (!/^[a-z0-9]{6,15}$/.test(values.id)) {
            setErrors(prev => ({ ...prev, id: 'ID는 6~15자, 소문자와 숫자만 가능합니다.' }));
            return;
        }

        try {
            const resp = await fetch('/api/auth/signup/check-loginId', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loginId: values.id })
            });
            const data = await resp.json();
            if (data.exists) {
                setErrors(prev => ({ ...prev, id: '이미 사용 중인 ID입니다.' }));
                setIsIdChecked(false);
            } else {
                setIsIdChecked(true);
                setErrors(prev => ({ ...prev, id: '' }));
            }
        } catch (e) {
            setErrors(prev => ({ ...prev, id: '중복 체크 중 오류가 발생했습니다.' }));
        }
    };

    const handleCheckNickname = async () => {
        if (!values.nickName.trim()) {
            setErrors(prev => ({ ...prev, nickName: '닉네임을 입력하세요.' }));
            return;
        }
        try {
            const resp = await fetch('/api/auth/signup/check-nickname', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickName: values.nickName })
            });
            const data = await resp.json();
            if (data.exists) {
                setErrors(prev => ({ ...prev, nickName: '이미 사용 중인 닉네임입니다.' }));
                setIsNickNameChecked(false);
            } else {
                setIsNickNameChecked(true);
                setErrors(prev => ({ ...prev, nickName: '' }));
            }
        } catch (e) {
            setErrors(prev => ({ ...prev, nickName: '중복 체크 중 오류가 발생했습니다.' }));
        }
    };

    const pw = values.password || '';
    const passwordChecks = {
        length: pw.length >= 8 && pw.length <= 20,
        letter: /[A-Za-z]/.test(pw),
        digit: /\d/.test(pw),
        special: /[^A-Za-z0-9]/.test(pw),
        noSpace: !/\s/.test(pw),
    };
    const allPasswordRulesOk = Object.values(passwordChecks).every(Boolean);

    const pwRules = [
        { key: 'length', text: '8~20자', ok: passwordChecks.length },
        { key: 'letter', text: '영문자 1자 이상 (대소문자 무관)', ok: passwordChecks.letter },
        { key: 'digit', text: '숫자 1자 이상', ok: passwordChecks.digit },
        { key: 'special', text: '특수문자 1자 이상', ok: passwordChecks.special },
        { key: 'noSpace', text: '공백 없음', ok: passwordChecks.noSpace },
    ];

    const failingRules = pwRules.filter((r) => !r.ok);

    const validateAll = () => {
        const next = {};
        Object.keys(values).forEach((k) => {
            next[k] = validateField(k, values[k]);
        });
        if (!allPasswordRulesOk) {
            next.password = next.password || '비밀번호 규칙을 모두 충족해야 합니다.';
        }

        const firstErrorKey = Object.keys(next).find((k) => next[k]);

        setErrors(next);

        const refsMap = {
            id: idRef,
            password: pwRef,
            passwordConfirm: pwConfirmRef,
            email: emailRef,
            nickName: nickNameRef,
        };

        if (firstErrorKey && refsMap[firstErrorKey] && refsMap[firstErrorKey].current) {
            try {
                refsMap[firstErrorKey].current.focus();
            } catch (e) {
                console.error('Focus error', e);
            }
        }

        const required = ['id', 'password', 'passwordConfirm', 'email', 'nickName'];
        return required.every((r) => !next[r]) && allPasswordRulesOk;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateAll()) return;

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    loginId: values.id,
                    password: values.password,
                    userEmail: values.email,
                    nickName: values.nickName,
                    introduction: "" // 일단 빈값
                })
            });

            if (response.ok) {
                setValues({ id: '', password: '', passwordConfirm: '', email: '', nickName: '' });
                setErrors({});
                setSubmitted(true);
            } else {
                const errorData = await response.json();
                setErrors((prev) => ({ ...prev, id: errorData.message || '회원가입에 실패했습니다.' }));
            }
        } catch (err) {
            console.error(err);
            setErrors((prev) => ({ ...prev, id: '서버와의 통신 중 오류가 발생했습니다.' }));
        }
    };

    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [authCode, setAuthCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [timer, setTimer] = useState(0); // 초 단위
    const timerRef = useRef(null);

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
        if (!values.email || !emailRegex.test(values.email)) {
            setErrors(prev => ({ ...prev, email: '유효한 이메일을 입력하세요.' }));
            return;
        }

        try {
            const resp = await fetch('/api/auth/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: values.email })
            });
            if (resp.ok) {
                setIsCodeSent(true);
                startTimer();
                setErrors(prev => ({ ...prev, email: '' }));
                alert('인증 코드가 전송되었습니다. 이메일을 확인해주세요.');
            } else {
                alert('이메일 전송에 실패했습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('오류가 발생했습니다.');
        }
    };

    const handleVerifyCode = async () => {
        if (!authCode) {
            alert('인증 코드를 입력하세요.');
            return;
        }

        try {
            const resp = await fetch('/api/auth/email/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: values.email, code: authCode })
            });

            if (resp.ok) {
                setIsEmailVerified(true);
                clearInterval(timerRef.current);
                alert('이메일 인증이 완료되었습니다.');
            } else {
                alert('인증 코드가 올바르지 않거나 만료되었습니다.');
            }
        } catch (e) {
            console.error(e);
            alert('인증 중 오류가 발생했습니다.');
        }
    };

    const isFormValid = () => {
        if (!values.id || !values.password || !values.passwordConfirm || !values.email || !values.nickName || !isIdChecked || !isNickNameChecked || !isEmailVerified) {
            return false;
        }

        return (
            !errors.id &&
            !errors.password &&
            !errors.passwordConfirm &&
            !errors.email &&
            !errors.nickName &&
            allPasswordRulesOk
        );
    };

    // ... 기존 코드 유지

    return (
        <div id='SignUp'>
            {submitted ? (
                // ... 성공 화면
                <div className='signup-success' role='status' aria-live='polite'>
                    <p>
                        <h2>회원가입이 완료되었습니다</h2>
                        <h2>로그인 후 서비스를 이용하세요.</h2>
                    </p>
                </div>
            ) : (
                <div className='signup-container'>
                    {/* ... 폼 헤더 */}
                    <h2 className='signup-title'>회원가입</h2>
                    <form className='signup-form' onSubmit={handleSubmit} noValidate>
                        {/* ID 입력 필드 (생략 없이 유지) */}
                        <label className='form-row' htmlFor='signup-id'>
                            <div className='label-text'>
                                ID <span className='necessary'>*</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    id='signup-id'
                                    ref={idRef}
                                    className='input-field'
                                    type='text'
                                    name='id'
                                    value={values.id}
                                    onChange={handleChange}
                                    aria-describedby={errors.id ? 'signup-id-error' : undefined}
                                    aria-invalid={!!errors.id}
                                />
                                <button
                                    type='button'
                                    onClick={handleCheckId}
                                    disabled={!values.id || !/^[a-z0-9]{6,15}$/.test(values.id)}
                                    className='check-button'
                                >
                                    중복 확인
                                </button>
                            </div>
                            <div>
                                {isIdChecked && !errors.id && (
                                    <div className='field-success' style={{ color: '#28a745', fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>
                                        ✓ 사용 가능한 ID입니다.
                                    </div>
                                )}
                                {(submitted || errors.id) && errors.id && (
                                    <div id='signup-id-error' className='field-error' role='alert'>
                                        {errors.id}
                                    </div>
                                )}
                            </div>
                        </label>

                        {/* PW 입력 필드 (기존 유지) */}
                        <label className='form-row' htmlFor='signup-password'>
                            <div className='label-text'>
                                PW <span className='necessary'>*</span>
                            </div>
                            <input
                                id='signup-password'
                                ref={pwRef}
                                className='input-field'
                                type='password'
                                name='password'
                                value={values.password}
                                onChange={handleChange}
                                aria-describedby={
                                    [
                                        errors.password ? 'signup-password-error' : undefined,
                                        failingRules.length ? 'signup-password-hint' : undefined,
                                    ]
                                        .filter(Boolean)
                                        .join(' ') || undefined
                                }
                                aria-invalid={!!errors.password}
                            />
                            {(submitted || errors.password) && errors.password && (
                                <div
                                    id='signup-password-error'
                                    className='field-error'
                                    role='alert'
                                >
                                    {errors.password}
                                </div>
                            )}

                            {failingRules.length > 0 && (
                                <div
                                    id='signup-password-hint'
                                    className='pw-rules'
                                    aria-live='polite'
                                >
                                    {failingRules.map((r) => (
                                        <div key={r.key} className={`pw-rule fail`}>
                                            <span className='pw-rule-icon'>✕</span>
                                            <span className='pw-rule-text'>{r.text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </label>

                        {/* PW 확인 (기존 유지) */}
                        <label className='form-row' htmlFor='signup-password-confirm'>
                            <div className='label-text'>
                                PW 확인 <span className='necessary'>*</span>
                            </div>
                            <input
                                id='signup-password-confirm'
                                ref={pwConfirmRef}
                                className='input-field'
                                type='password'
                                name='passwordConfirm'
                                value={values.passwordConfirm}
                                onChange={handleChange}
                                aria-describedby={
                                    errors.passwordConfirm
                                        ? 'signup-password-confirm-error'
                                        : undefined
                                }
                                aria-invalid={!!errors.passwordConfirm}
                            />
                            {(submitted || errors.passwordConfirm) && errors.passwordConfirm && (
                                <div
                                    id='signup-password-confirm-error'
                                    className='field-error'
                                    role='alert'
                                >
                                    {errors.passwordConfirm}
                                </div>
                            )}
                        </label>

                        {/* Email 입력 필드 (수정됨) */}
                        <label className='form-row' htmlFor='signup-email'>
                            <div className='label-text'>
                                Email <span className='necessary'>*</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    id='signup-email'
                                    ref={emailRef}
                                    className='input-field'
                                    type='email'
                                    name='email'
                                    value={values.email}
                                    onChange={(e) => {
                                        handleChange(e);
                                        setIsEmailVerified(false); // 이메일 변경 시 재인증 필요
                                        setIsCodeSent(false);
                                        setTimer(0);
                                    }}
                                    disabled={isEmailVerified} // 인증 완료 시 수정 불가
                                    aria-describedby={errors.email ? 'signup-email-error' : undefined}
                                    aria-invalid={!!errors.email}
                                />
                                <button
                                    type='button'
                                    onClick={handleSendEmail}
                                    disabled={!values.email || !emailRegex.test(values.email) || isEmailVerified}
                                    className='check-button'
                                >
                                    {isEmailVerified ? '인증 완료' : (isCodeSent ? '재전송' : '인증번호 전송')}
                                </button>
                            </div>

                            {/* 인증 번호 입력란 (전송 시 표시) */}
                            {isCodeSent && !isEmailVerified && (
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type='text'
                                        placeholder='인증코드 6자리'
                                        className='input-field'
                                        value={authCode}
                                        onChange={(e) => setAuthCode(e.target.value)}
                                        maxLength={6}
                                    />
                                    <span style={{ color: 'red', fontWeight: 'bold', minWidth: '50px' }}>
                                        {formatTime(timer)}
                                    </span>
                                    <button
                                        type='button'
                                        onClick={handleVerifyCode}
                                        className='check-button'
                                        disabled={timer === 0}
                                    >
                                        확인
                                    </button>
                                </div>
                            )}

                            {(submitted || errors.email) && errors.email && (
                                <div id='signup-email-error' className='field-error' role='alert'>
                                    {errors.email}
                                </div>
                            )}
                        </label>

                        {/* 닉네임 입력 (기존 유지) */}
                        <label className='form-row' htmlFor='signup-nickName'>
                            <div className='label-text'>
                                닉네임 <span className='necessary'>*</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    id='signup-nickName'
                                    ref={nickNameRef}
                                    className='input-field'
                                    type='text'
                                    name='nickName'
                                    value={values.nickName}
                                    onChange={(e) => {
                                        handleChange(e);
                                        setIsNickNameChecked(false);
                                    }}
                                    aria-describedby={errors.nickName ? 'signup-nickName-error' : undefined}
                                    aria-invalid={!!errors.nickName}
                                />
                                <button
                                    type="button"
                                    onClick={handleCheckNickname}
                                    className="check-button"
                                    disabled={!values.nickName}
                                >
                                    중복 확인
                                </button>
                            </div>
                            {errors.nickName && (
                                <div className='field-error' style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                                    {errors.nickName}
                                </div>
                            )}
                            {isNickNameChecked && !errors.nickName && (
                                <div className='field-success' style={{ color: '#28a745', fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>
                                    ✓ 사용 가능한 닉네임입니다.
                                </div>
                            )}
                        </label>

                        <div className='form-actions'>
                            <button
                                className='submit-btn'
                                type='submit'
                                disabled={!isFormValid()}
                                aria-disabled={!isFormValid()}
                            >
                                회원가입
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SignUp;
