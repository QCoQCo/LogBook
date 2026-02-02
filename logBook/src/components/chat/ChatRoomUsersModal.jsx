import React, { useState, useEffect } from 'react';
import { subscribeToRoomUsers } from '../../utils/chatService';
import { useUserData } from '../../context';
import './ChatRoomUsersModal.scss';

const ChatRoomUsersModal = ({ isOpen, onClose, roomName, currentUser }) => {
    const { getUserProfilePhoto } = useUserData();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !roomName) return;

        setLoading(true);
        setError(null);
        setUsers([]);

        // 채팅방 유저 목록을 실시간으로 구독
        const unsubscribe = subscribeToRoomUsers(
            roomName,
            (activeUsers) => {
                // 현재 사용자를 맨 위로 정렬하고 나머지는 이름순으로 정렬
                const sortedUsers = activeUsers.sort((a, b) => {
                    if (a.id === currentUser?.id) return -1;
                    if (b.id === currentUser?.id) return 1;
                    const aName = a.nickName ?? a.name ?? '';
                    const bName = b.nickName ?? b.name ?? '';
                    return aName.localeCompare(bName);
                });

                setUsers(sortedUsers);
                setLoading(false);
            },
            (error) => {
                console.error('유저 목록 구독 오류:', error);
                setError('유저 목록을 불러오는 중 오류가 발생했습니다.');
                setLoading(false);
            }
        );

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [isOpen, roomName, currentUser?.id]);

    // 모달 외부 클릭 시 닫기
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const UserProfilePhoto = (user) => {
        return getUserProfilePhoto(user.id, user.nickName ?? user.name);
    };

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // 시간 포맷팅 함수
    const formatTime = (timestamp) => {
        if (!timestamp) return '';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60 * 1000) {
            // 1분 미만
            return '방금 전';
        } else if (diff < 60 * 60 * 1000) {
            // 1시간 미만
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes}분 전`;
        } else if (diff < 24 * 60 * 60 * 1000) {
            // 24시간 미만
            const hours = Math.floor(diff / (60 * 60 * 1000));
            return `${hours}시간 전`;
        } else {
            return date.toLocaleDateString();
        }
    };

    if (!isOpen) return null;

    return (
        <div className='modal-overlay chat-room-users-modal' onClick={handleOverlayClick}>
            <div className='modal-content'>
                <div className='modal-header'>
                    <h3>
                        <span className='room-indicator'>👥</span>
                        {roomName} 접속 유저
                    </h3>
                    <button className='close-button' onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className='modal-body'>
                    {loading && (
                        <div className='loading-state'>
                            <div className='loading-spinner'></div>
                            <p>유저 목록을 불러오는 중...</p>
                        </div>
                    )}

                    {error && (
                        <div className='error-state'>
                            <p className='error-message'>{error}</p>
                            <button
                                className='retry-button'
                                onClick={() => window.location.reload()}
                            >
                                다시 시도
                            </button>
                        </div>
                    )}

                    {!loading && !error && (
                        <>
                            <div className='users-count'>
                                총 <span className='count-number'>{users.length}</span>명이 접속 중
                            </div>

                            <div className='users-list'>
                                {users.length === 0 ? (
                                    <div className='no-users'>현재 접속한 유저가 없습니다.</div>
                                ) : (
                                    users.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`user-item ${
                                                user.id === currentUser?.id ? 'current-user' : ''
                                            }`}
                                        >
                                            <div className='user-avatar'>
                                                <div className='avatar-circle'>
                                                    <img
                                                        src={
                                                            UserProfilePhoto(user)
                                                                ? UserProfilePhoto(user)
                                                                : '/img/userProfile-ex.png'
                                                        }
                                                        alt='user-avatar'
                                                    />
                                                </div>
                                                <div className='online-indicator'></div>
                                            </div>

                                            <div className='user-info'>
                                                <div className='user-name'>
                                                    {user.nickName ?? user.name}
                                                    {user.id === currentUser?.id && (
                                                        <span className='current-user-badge'>
                                                            (나)
                                                        </span>
                                                    )}
                                                </div>
                                                <div className='user-details'>
                                                    <span className='join-time'>
                                                        입장: {formatTime(user.joinedAt)}
                                                    </span>
                                                    {user.lastSeen && (
                                                        <span className='last-seen'>
                                                            최근 활동: {formatTime(user.lastSeen)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatRoomUsersModal;
