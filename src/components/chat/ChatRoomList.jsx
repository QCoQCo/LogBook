import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import { useLogBook, useAuth } from '../../context/LogBookContext';
import { useState } from 'react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

const ChatRoomList = () => {
    const { chatRoomList, currentChatRoom, switchChatRoom, createChatRoom, deleteChatRoom } =
        useLogBook();
    const { currentUser, isLogin } = useAuth();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newRoomData, setNewRoomData] = useState({
        name: '',
        description: '',
        capacity: 50,
        isPrivate: false,
    });

    const handleRoomClick = (room) => {
        switchChatRoom(room);
    };

    // 채팅방 생성 핸들러
    const handleCreateRoom = async () => {
        if (!newRoomData.name.trim()) {
            alert('채팅방 이름을 입력해주세요.');
            return;
        }

        try {
            await createChatRoom({
                ...newRoomData,
                admin: currentUser.name,
                userId: currentUser.id,
            });
            setShowCreateModal(false);
            setNewRoomData({
                name: '',
                description: '',
                capacity: 50,
                isPrivate: false,
            });
        } catch (error) {
            alert('채팅방 생성에 실패했습니다.');
            console.error('채팅방 생성 오류:', error);
        }
    };

    // 채팅방 삭제 핸들러
    const handleDeleteRoom = async (room, e) => {
        e.stopPropagation();

        if (!isLogin || room.userId !== currentUser?.id) {
            alert('본인이 생성한 채팅방만 삭제할 수 있습니다.');
            return;
        }

        if (confirm(`"${room.name}" 채팅방을 삭제하시겠습니까?`)) {
            try {
                await deleteChatRoom(room.id);
            } catch (error) {
                alert('채팅방 삭제에 실패했습니다.');
                console.error('채팅방 삭제 오류:', error);
            }
        }
    };

    // 로그인하지 않은 경우 일반 채팅방만 표시
    const displayRooms = isLogin
        ? chatRoomList
        : chatRoomList.filter((room) => room.name === '일반 채팅방');

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
                    <button className='create-room-btn' onClick={() => setShowCreateModal(true)}>
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
                className='mySwiper'
            >
                {displayRooms.map((room) => (
                    <SwiperSlide key={room.id}>
                        <div
                            className={`chat-room-card ${
                                currentChatRoom?.id === room.id ? 'active' : ''
                            }`}
                            onClick={() => handleRoomClick(room)}
                        >
                            <div className='room-name'>{room.name}</div>
                            <div className='room-info'>
                                <span className='room-users'>
                                    {room.currentUsers}/{room.capacity}
                                </span>
                                {room.isPrivate && <span className='room-private'>🔒</span>}
                            </div>
                            <div className='room-description'>{room.description}</div>
                            <div className='room-admin'>관리자: {room.admin}</div>
                            {isLogin && room.userId === currentUser?.id && (
                                <button
                                    className='delete-room-btn'
                                    onClick={(e) => handleDeleteRoom(room, e)}
                                    title='채팅방 삭제'
                                >
                                    🗑️
                                </button>
                            )}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {displayRooms.length === 0 && <div className='no-rooms'>채팅방이 없습니다.</div>}

            {/* 채팅방 생성 모달 */}
            {showCreateModal && (
                <div className='modal-overlay' onClick={() => setShowCreateModal(false)}>
                    <div className='modal-content' onClick={(e) => e.stopPropagation()}>
                        <h3>새 채팅방 생성</h3>
                        <div className='form-group'>
                            <label>채팅방 이름 *</label>
                            <input
                                type='text'
                                value={newRoomData.name}
                                onChange={(e) =>
                                    setNewRoomData({ ...newRoomData, name: e.target.value })
                                }
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
                        <div className='modal-buttons'>
                            <button onClick={handleCreateRoom} className='create-btn'>
                                생성
                            </button>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className='cancel-btn'
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatRoomList;
