import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import { useLogBook, useAuth } from '../../context/LogBookContext';
import { useCallback, useMemo } from 'react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

const ChatRoomList = ({ onCreateRoom, onPasswordModal }) => {
    const { chatRoomList, currentChatRoom, switchChatRoom, deleteChatRoom, roomUsers } =
        useLogBook();
    const { currentUser, isLogin } = useAuth();

    // 특정 채팅방의 실제 접속 유저수 가져오기 - 메모이제이션
    const getRoomUserCount = useCallback(
        (roomName) => {
            const users = roomUsers[roomName] || [];
            return users.length;
        },
        [roomUsers]
    );

    // 표시할 채팅방 목록 메모이제이션
    const displayRooms = useMemo(() => {
        return isLogin ? chatRoomList : chatRoomList.filter((room) => room.name === '일반 채팅방');
    }, [isLogin, chatRoomList]);

    // 채팅방 클릭 핸들러 - 메모이제이션
    const handleRoomClick = useCallback(
        (room) => {
            if (room.isPrivate) {
                onPasswordModal(room);
            } else {
                switchChatRoom(room);
            }
        },
        [switchChatRoom, onPasswordModal]
    );

    // 채팅방 삭제 핸들러 - 메모이제이션
    const handleDeleteRoom = useCallback(
        async (room, e) => {
            e.stopPropagation();

            if (room.isSystem) {
                alert('기본 채팅방은 삭제할 수 없습니다.');
                return;
            }

            if (!isLogin || room.userId !== currentUser?.id) {
                alert('본인이 생성한 채팅방만 삭제할 수 있습니다.');
                return;
            }

            if (confirm(`"${room.name}" 채팅방을 삭제하시겠습니까?`)) {
                try {
                    await deleteChatRoom(room.id);
                } catch (error) {
                    alert(error.message || '채팅방 삭제에 실패했습니다.');
                    console.error('채팅방 삭제 오류:', error);
                }
            }
        },
        [isLogin, currentUser, deleteChatRoom]
    );

    return (
        <div id='ChatRoomList'>
            <div className='chat-room-list-header'>
                <h3>채팅방 목록</h3>
                {currentChatRoom && (
                    <div className='current-room'>
                        현재: <strong>{currentChatRoom.name}</strong>
                    </div>
                )}
                {isLogin && (
                    <button className='create-room-btn' onClick={onCreateRoom}>
                        채팅방 생성
                    </button>
                )}
            </div>

            {!isLogin && (
                <div className='login-notice'>
                    <p>로그인하시면 더 많은 채팅방을 이용할 수 있습니다.</p>
                </div>
            )}

            <Swiper
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'}
                coverflowEffect={{
                    rotate: 50,
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows: true,
                }}
                modules={[EffectCoverflow]}
                className='chat-room-swiper'
            >
                {displayRooms.map((room) => (
                    <SwiperSlide key={room.id}>
                        <div
                            className={`chat-room-card ${
                                currentChatRoom?.id === room.id ? 'active' : ''
                            } ${room.isSystem ? 'system-room' : 'user-room'}`}
                            onClick={() => handleRoomClick(room)}
                        >
                            <div className='room-name'>{room.name}</div>
                            <div className='room-info'>
                                <span className='room-users'>
                                    {getRoomUserCount(room.name)}/{room.capacity}
                                </span>
                                {room.isPrivate && (
                                    <span className='room-private' title='비공개 채팅방'>
                                        🔒
                                    </span>
                                )}
                            </div>
                            <div className='room-description'>{room.description}</div>
                            <div className='room-admin'>관리자: {room.admin}</div>

                            {/* 🔑 시스템 채팅방이 아닌 경우에만 삭제 버튼 표시 */}
                            {isLogin && !room.isSystem && room.userId === currentUser?.id && (
                                <button
                                    className='delete-room-btn'
                                    onClick={(e) => handleDeleteRoom(room, e)}
                                    title='채팅방 삭제'
                                >
                                    🗑️
                                </button>
                            )}

                            {/* 시스템 채팅방 표시 */}
                            {room.isSystem && (
                                <div className='system-badge' title='기본 채팅방'>
                                    🏛️ 기본방
                                </div>
                            )}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {displayRooms.length === 0 && <div className='no-rooms'>채팅방이 없습니다.</div>}
        </div>
    );
};

export default ChatRoomList;
