import React from 'react';

const PasswordModal = ({
    isOpen,
    onClose,
    selectedRoom,
    passwordInput,
    setPasswordInput,
    error,
    onSubmit,
    onKeyPress,
}) => {
    if (!isOpen || !selectedRoom) return null;

    return (
        <div className='modal-overlay' onClick={onClose}>
            <div className='modal-content password-modal' onClick={(e) => e.stopPropagation()}>
                <h3>🔒 비공개 채팅방</h3>
                <p>
                    <strong>{selectedRoom.name}</strong>에 입장하려면 비밀번호를 입력하세요.
                </p>
                <div className='form-group'>
                    <label>비밀번호</label>
                    <input
                        type='password'
                        value={passwordInput}
                        onChange={(e) => {
                            setPasswordInput(e.target.value);
                        }}
                        onKeyDown={onKeyPress}
                        placeholder='4자리 비밀번호를 입력하세요'
                        maxLength={4}
                        autoFocus
                        className={error ? 'error' : ''}
                    />
                    {error && <div className='error-message'>{error}</div>}
                </div>
                <div className='modal-buttons'>
                    <button onClick={onSubmit} className='submit-btn'>
                        입장
                    </button>
                    <button onClick={onClose} className='cancel-btn'>
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordModal;
