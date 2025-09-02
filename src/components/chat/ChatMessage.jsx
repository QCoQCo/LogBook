import { useState, useMemo, useCallback } from 'react';
import { useLogBook } from '../../context/LogBookContext';
import UserInfoModal from './UserInfoModal';

const ChatMessage = ({ messages, currentUser, handleDeleteMessage, messagesEndRef }) => {
    const { getUserProfilePhoto, getUserInfo, userDataLoaded, userDataLoading } = useLogBook();
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 프로필 클릭 핸들러 메모이제이션
    const handleProfileClick = useCallback(
        (userId, userName) => {
            const userInfo = getUserInfo(userId, userName);
            if (userInfo) {
                setSelectedUser(userInfo);
                setIsModalOpen(true);
            }
        },
        [getUserInfo]
    );

    // 모달 닫기 핸들러 메모이제이션
    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setSelectedUser(null);
    }, []);

    // 메시지 데이터를 메모이제이션하여 불필요한 재계산 방지
    const processedMessages = useMemo(() => {
        return messages.map((message) => {
            const isOwnMessage =
                message.userId === currentUser.id ||
                (message.sessionId && message.sessionId === currentUser.sessionId);

            const profilePhoto = !isOwnMessage
                ? getUserProfilePhoto(message.userId, message.userName)
                : null;

            return {
                ...message,
                isOwnMessage,
                profilePhoto,
            };
        });
    }, [messages, currentUser.id, currentUser.sessionId, getUserProfilePhoto]);

    return (
        <div className='chat-message'>
            <div className='messages-container'>
                {/* 실시간 메시지 렌더링 - 최적화된 버전 */}
                {processedMessages.map((message) => (
                    <div
                        key={message.id}
                        className={`message ${
                            message.isOwnMessage ? 'own-message' : 'other-message'
                        }`}
                    >
                        {/* 상대방 메시지인 경우 프로필 사진 표시 */}
                        {!message.isOwnMessage && message.profilePhoto && (
                            <div className='profile-photo-container'>
                                <img
                                    src={message.profilePhoto}
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
                                {message.isOwnMessage && (
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
                ))}
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
