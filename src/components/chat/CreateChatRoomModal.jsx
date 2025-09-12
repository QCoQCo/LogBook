import React from 'react';

const CreateChatRoomModal = ({ isOpen, onClose, newRoomData, setNewRoomData, onCreateRoom }) => {
    if (!isOpen) return null;

    return (
        <div className='modal-overlay' onClick={onClose}>
            <div className='modal-content' onClick={(e) => e.stopPropagation()}>
                <h3>새 채팅방 생성</h3>
                <div className='form-group'>
                    <label>채팅방 이름 *</label>
                    <input
                        type='text'
                        value={newRoomData.name}
                        onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                        placeholder='채팅방 이름을 입력하세요'
                        maxLength={30}
                    />
                </div>
                <div className='form-group'>
                    <label>설명</label>
                    <textarea
                        value={newRoomData.description}
                        onChange={(e) =>
                            setNewRoomData({ ...newRoomData, description: e.target.value })
                        }
                        placeholder='채팅방 설명을 입력하세요'
                        maxLength={100}
                        rows={3}
                    />
                </div>
                <div className='form-group'>
                    <label>최대 인원</label>
                    <input
                        type='number'
                        value={newRoomData.capacity}
                        onChange={(e) =>
                            setNewRoomData({
                                ...newRoomData,
                                capacity: parseInt(e.target.value) || 50,
                            })
                        }
                        min={2}
                        max={500}
                    />
                </div>
                <div className='form-group'>
                    <label>
                        <input
                            type='checkbox'
                            checked={newRoomData.isPrivate}
                            onChange={(e) =>
                                setNewRoomData({
                                    ...newRoomData,
                                    isPrivate: e.target.checked,
                                })
                            }
                        />
                        비공개 채팅방
                    </label>
                </div>
                {newRoomData.isPrivate && (
                    <div className='form-group'>
                        <label>비밀번호 (4자리)</label>
                        <input
                            type='password'
                            value={newRoomData.password}
                            onChange={(e) =>
                                setNewRoomData({
                                    ...newRoomData,
                                    password: e.target.value,
                                })
                            }
                            placeholder='비밀번호를 입력하세요'
                            maxLength={4}
                            minLength={4}
                        />
                        <small>기본값: 0000</small>
                    </div>
                )}
                <div className='modal-buttons'>
                    <button onClick={onCreateRoom} className='create-btn'>
                        생성
                    </button>
                    <button onClick={onClose} className='cancel-btn'>
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateChatRoomModal;
