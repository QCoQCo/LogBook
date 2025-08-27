import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import { useLogBook } from '../../context/LogBookContext';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

const ChatRoomList = () => {
    const { chatRoomList, currentChatRoom, switchChatRoom } = useLogBook();

    const handleRoomClick = (room) => {
        switchChatRoom(room);
    };

    return (
        <div id='ChatRoomList'>
            <div className='chat-room-list-header'>
                <h3>채팅방 목록</h3>
                {currentChatRoom && (
                    <div className='current-room'>
                        현재: <strong>{currentChatRoom.name}</strong>
                    </div>
                )}
            </div>

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
                {chatRoomList.map((room) => (
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
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {chatRoomList.length === 0 && <div className='no-rooms'>채팅방이 없습니다.</div>}
        </div>
    );
};

export default ChatRoomList;
