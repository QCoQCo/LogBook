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
        phone: '',
    });

    const [errors, setErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const idRef = useRef(null);
    const pwRef = useRef(null);
    const pwConfirmRef = useRef(null);
    const emailRef = useRef(null);
    const phoneRef = useRef(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\-()\s]{6,20}$/;
    // PW: 8-20 chars, must include letter, digit and special char, no spaces (case-insensitive letter check)
    const passwordRegex = /^(?=.{8,20}$)(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9])(?!.*\s).+$/;

    const validateField = (name, value) => {
        switch (name) {
            case 'id':
                if (!value.trim()) return 'ID를 입력하세요.';
                if (!/^[a-z0-9]{6,15}$/.test(value))
                    return 'ID는 6~15자, 소문자와 숫자만 사용할 수 있습니다.';
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
            case 'phone':
                if (value && !phoneRegex.test(value)) return '유효한 전화번호를 입력하세요.';
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
        // if password changed, re-validate confirm
        if (name === 'password' && values.passwordConfirm) {
            setErrors((prev) => ({
                ...prev,
                passwordConfirm: validateField('passwordConfirm', values.passwordConfirm),
            }));
        }
    };

    // derived per-rule checks for password (used to show individual rule status)
    const pw = values.password || '';
    const passwordChecks = {
        length: pw.length >= 8 && pw.length <= 20,
        letter: /[A-Za-z]/.test(pw),
        digit: /\d/.test(pw),
        special: /[^A-Za-z0-9]/.test(pw),
        noSpace: !/\s/.test(pw),
    };
    const allPasswordRulesOk = Object.values(passwordChecks).every(Boolean);

    // ordered rule list for rendering and filtering
    const pwRules = [
        { key: 'length', text: '8~20자', ok: passwordChecks.length },
        { key: 'letter', text: '영문자 1자 이상 (대소문자 무관)', ok: passwordChecks.letter },
        { key: 'digit', text: '숫자 1자 이상', ok: passwordChecks.digit },
        { key: 'special', text: '특수문자 1자 이상', ok: passwordChecks.special },
        { key: 'noSpace', text: '공백 없음', ok: passwordChecks.noSpace },
    ];

    // only show rules that are NOT satisfied
    const failingRules = pwRules.filter((r) => !r.ok);

    const validateAll = () => {
        const next = {};
        Object.keys(values).forEach((k) => {
            next[k] = validateField(k, values[k]);
        });
        // if password rule checklist not all ok, add generic password error
        if (!allPasswordRulesOk) {
            next.password = next.password || '비밀번호 규칙을 모두 충족해야 합니다.';
        }

        // find first error key to focus
        const firstErrorKey = Object.keys(next).find((k) => next[k]);

        setErrors(next);

        const refsMap = {
            id: idRef,
            password: pwRef,
            passwordConfirm: pwConfirmRef,
            email: emailRef,
            phone: phoneRef,
        };

        if (firstErrorKey && refsMap[firstErrorKey] && refsMap[firstErrorKey].current) {
            try {
                refsMap[firstErrorKey].current.focus();
            } catch (e) {
                // ignore
            }
        }

        // return true if no errors for required fields (id, password, passwordConfirm, email) and password rules ok
        const required = ['id', 'password', 'passwordConfirm', 'email'];
        return required.every((r) => !next[r]) && allPasswordRulesOk;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateAll()) return;
        // store user data in localStorage (demo). Password is base64-encoded here for minimal obfuscation;
        // do NOT rely on this for real security — a server-side solution is required for production.
        try {
            await signupClient(values.id, values.password, values.email, values.phone);
            // reset form state
            setValues({ id: '', password: '', passwordConfirm: '', email: '', phone: '' });
            setErrors({});
            setSubmitted(true);
        } catch (err) {
            // signupClient throws when ID exists
            setErrors((prev) => ({ ...prev, id: err.message || '회원가입에 실패했습니다.' }));
        }
    };

    const isFormValid = () => {
        // Require id, password, passwordConfirm and email to be filled
        if (!values.id || !values.password || !values.passwordConfirm || !values.email)
            return false;
        // no current error messages (phone is optional)
        return (
            !errors.id &&
            !errors.password &&
            !errors.passwordConfirm &&
            !errors.email &&
            allPasswordRulesOk
        );
    };

    return (
        <div id='SignUp'>
            {submitted ? (
                <div className='signup-success' role='status' aria-live='polite'>
                    <p>
                        <h2>회원가입이 완료되었습니다</h2>
                        <h2>로그인 후 서비스를 이용하세요.</h2>
                    </p>
                </div>
            ) : (
                <div className='signup-container'>
                    <h2 className='signup-title'>회원가입</h2>
                    <form className='signup-form' onSubmit={handleSubmit} noValidate>
                        <label className='form-row' htmlFor='signup-id'>
                            <div className='label-text'>
                                ID <span className='necessary'>*</span>
                            </div>
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
                            {(submitted || errors.id) && errors.id && (
                                <div id='signup-id-error' className='field-error' role='alert'>
                                    {errors.id}
                                </div>
                            )}
                        </label>

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

                            {/* show only failing rules; hide satisfied items */}
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

                        <label className='form-row' htmlFor='signup-email'>
                            <div className='label-text'>
                                Email <span className='necessary'>*</span>
                            </div>
                            <input
                                id='signup-email'
                                ref={emailRef}
                                className='input-field'
                                type='email'
                                name='email'
                                value={values.email}
                                onChange={handleChange}
                                aria-describedby={errors.email ? 'signup-email-error' : undefined}
                                aria-invalid={!!errors.email}
                            />
                            {(submitted || errors.email) && errors.email && (
                                <div id='signup-email-error' className='field-error' role='alert'>
                                    {errors.email}
                                </div>
                            )}
                        </label>

                        <label className='form-row' htmlFor='signup-phone'>
                            <div className='label-text'>Phone</div>
                            <input
                                id='signup-phone'
                                ref={phoneRef}
                                className='input-field'
                                type='tel'
                                name='phone'
                                value={values.phone}
                                onChange={handleChange}
                                aria-describedby={errors.phone ? 'signup-phone-error' : undefined}
                                aria-invalid={!!errors.phone}
                            />
                            {(submitted || errors.phone) && errors.phone && (
                                <div id='signup-phone-error' className='field-error' role='alert'>
                                    {errors.phone}
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
