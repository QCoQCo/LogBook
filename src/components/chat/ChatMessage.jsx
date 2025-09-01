import { useState } from 'react';
import { useLogBook } from '../../context/LogBookContext';
import UserInfoModal from './UserInfoModal';

const ChatMessage = ({ messages, currentUser, handleDeleteMessage, messagesEndRef }) => {
    const { getUserProfilePhoto, getUserInfo, userDataLoaded, userDataLoading } = useLogBook();
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 프로필 클릭 핸들러
    const handleProfileClick = (userId, userName) => {
        const userInfo = getUserInfo(userId, userName);
        if (userInfo) {
            setSelectedUser(userInfo);
            setIsModalOpen(true);
        }
    };

    // 모달 닫기 핸들러
    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    return (
        <div className='chat-message'>
            <div className='messages-container'>
                {/* 실시간 메시지 렌더링 */}
                {messages.map((message) => {
                    // 메시지 소유권 판별: 같은 사용자 ID 또는 sessionId로 구분
                    const isOwnMessage =
                        message.userId === currentUser.id ||
                        (message.sessionId && message.sessionId === currentUser.sessionId);

                    // 상대방 메시지인 경우 프로필 사진 가져오기
                    const profilePhoto = !isOwnMessage
                        ? getUserProfilePhoto(message.userId, message.userName)
                        : null;

                    return (
                        <div
                            key={message.id}
                            className={`message ${isOwnMessage ? 'own-message' : 'other-message'}`}
                        >
                            {/* 상대방 메시지인 경우 프로필 사진 표시 */}
                            {!isOwnMessage && profilePhoto && (
                                <div className='profile-photo-container'>
                                    <img
                                        src={profilePhoto}
                                        alt={`${message.userName}의 프로필`}
                                        className='profile-photo clickable'
                                        onClick={() =>
                                            handleProfileClick(message.userId, message.userName)
                                        }
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                        title={`${message.userName}의 프로필 보기`}
                                    />
                                </div>
                            )}
                            <div className='message-content-wrapper'>
                                <div className='message-header'>
                                    <span className='user-name'>{message.userName}</span>
                                    <span className='timestamp'>
                                        {message.timestamp?.toDate?.()?.toLocaleTimeString() ||
                                            '방금 전'}
                                    </span>
                                    {isOwnMessage && (
                                        <button
                                            onClick={() => handleDeleteMessage(message.id)}
                                            className='delete-button'
                                            title='메시지 삭제'
                                        >
                                            삭제
                                        </button>
                                    )}
                                </div>
                                <div className='message-content'>{message.text}</div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* 사용자 정보 모달 */}
            <UserInfoModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                userInfo={selectedUser}
                currentUserId={currentUser.id}
            />
        </div>
    );
};

export default ChatMessage;
