import { useState, useMemo, useCallback } from 'react';
import { useChat, useUserData } from '../../context';
import UserInfoModal from './UserInfoModal';

// 메시지 날짜/시간 포맷팅 유틸리티 함수
const formatMessageTimestamp = (timestamp) => {
    if (!timestamp?.toDate) {
        return '방금 전';
    }

    const messageDate = timestamp.toDate();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDay = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
    );

    const timeDiff = today.getTime() - messageDay.getTime();
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
        // 오늘 메시지는 시간만 표시
        return messageDate.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    } else if (daysDiff === 1) {
        // 어제 메시지는 "어제" + 시간
        return `어제 ${messageDate.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })}`;
    } else if (daysDiff < 7) {
        // 일주일 이내는 요일 + 시간
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekday = weekdays[messageDate.getDay()];
        return `${weekday}요일 ${messageDate.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        })}`;
    } else {
        // 일주일 이상 지난 메시지는 날짜 표시
        return messageDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    }
};

const ChatMessage = ({
    messages,
    currentUser,
    handleDeleteMessage,
    messagesEndRef,
    openYTPopup,
    playTrackInPopup,
    currentTrack,
    isPopupOpen,
}) => {
    const { getUserProfilePhoto, getUserInfo, userDataLoaded, userDataLoading } = useUserData();
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

    // 음악 링크 클릭 핸들러 - playerPopup 사용
    const handleMusicLinkClick = useCallback(
        (musicData) => {
            if (musicData && musicData.link && openYTPopup) {
                // musicData를 playerPopup 형식으로 변환
                const songData = {
                    title: musicData.title,
                    link: musicData.link,
                    thumbnail: musicData.thumbnail,
                    contentId: musicData.contentId,
                };
                openYTPopup([songData], 0, { clearOnClose: true });
            } else if (musicData && musicData.link) {
                // fallback: 새 탭에서 열기
                window.open(musicData.link, '_blank', 'noopener,noreferrer');
            }
        },
        [openYTPopup]
    );

    // 메시지 데이터를 메모이제이션하여 불필요한 재계산 방지
    const processedMessages = useMemo(() => {
        return messages.map((message) => {
            // 로그인한 사용자만 메시지 소유권 확인 (sessionId 로직 제거)
            const isOwnMessage = currentUser.id && message.userId === currentUser.id;

            const profilePhoto = !isOwnMessage ? getUserProfilePhoto(message.userId) : null;

            // 음악 공유 메시지 파싱
            let musicData = null;
            let displayText = message.text;
            let isMusicShare = false;

            try {
                const parsedMessage = JSON.parse(message.text);
                if (parsedMessage.type === 'music_share' && parsedMessage.musicData) {
                    isMusicShare = true;
                    musicData = parsedMessage.musicData;
                    displayText = parsedMessage.text;
                }
            } catch (error) {
                // JSON 파싱 실패 시 일반 메시지로 처리
            }

            return {
                ...message,
                isOwnMessage,
                profilePhoto,
                isMusicShare,
                musicData,
                displayText,
            };
        });
    }, [messages, currentUser.id, getUserProfilePhoto]);

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
                        {!message.isOwnMessage && (
                            <div className='profile-photo-container'>
                                <img
                                    src={message.profilePhoto || '/img/userProfile-ex.png'}
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
                                    {formatMessageTimestamp(message.timestamp)}
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
                            <div className='message-content'>
                                {message.isMusicShare ? (
                                    <div className='music-share-message'>
                                        <div className='music-share-text'>
                                            {message.displayText}
                                        </div>
                                        <div
                                            className='music-share-card'
                                            onClick={() => handleMusicLinkClick(message.musicData)}
                                        >
                                            <div className='music-thumbnail'>
                                                <img
                                                    src={message.musicData.thumbnail}
                                                    alt={message.musicData.title}
                                                    onError={(e) => {
                                                        e.target.src = '/img/icon-image.png';
                                                    }}
                                                />
                                                <div className='play-overlay'>
                                                    <span className='play-icon'>▶️</span>
                                                </div>
                                            </div>
                                            <div className='music-info'>
                                                <div className='music-title'>
                                                    {message.musicData.title}
                                                </div>
                                                <div className='music-playlist'>
                                                    {message.musicData.playlistTitle}
                                                </div>
                                                <div className='click-hint'>
                                                    클릭하여 팝업 플레이어로 재생하기
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    message.displayText
                                )}
                            </div>
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
