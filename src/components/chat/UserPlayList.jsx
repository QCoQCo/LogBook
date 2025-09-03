import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Thumbs } from 'swiper/modules';
import { useAuth, useLogBook } from '../../context/LogBookContext';
import { sendMessageToRoom } from '../../utils/chatService';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';

const UserPlaylist = () => {
    const { currentUser, isLogin } = useAuth();
    const { currentChatRoom } = useLogBook();
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [playlistData, setPlaylistData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentSong, setCurrentSong] = useState(null);

    // 플레이리스트 데이터 로드
    const loadPlaylistData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/data/playlistData.json');
            if (!response.ok) {
                throw new Error('플레이리스트 데이터 로드 실패');
            }

            const data = await response.json();
            // 현재 사용자의 플레이리스트만 필터링 (로그인한 경우)
            const userPlaylist =
                isLogin && currentUser
                    ? data.filter((playlist) => playlist.userId === currentUser.id)
                    : data; // 비로그인시 모든 플레이리스트 표시

            setPlaylistData(userPlaylist);
        } catch (err) {
            console.error('플레이리스트 로드 오류:', err);
            setError('플레이리스트를 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    }, [isLogin, currentUser]);

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadPlaylistData();
    }, [loadPlaylistData]);

    // 현재 플레이리스트의 모든 노래들을 하나의 배열로 변환
    const allSongs = useMemo(() => {
        return playlistData.flatMap(
            (playlist) =>
                playlist.songs?.map((song) => ({
                    ...song,
                    playlistTitle: playlist.title,
                    playlistId: playlist.playId,
                    playlistDescription: playlist.description,
                })) || []
        );
    }, [playlistData]);

    // YouTube 링크에서 비디오 ID 추출
    const extractVideoId = useCallback((url) => {
        const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        return match ? match[1] : null;
    }, []);

    // 노래 선택 핸들러
    const handleSongSelect = useCallback((song) => {
        setCurrentSong(song);
        // 여기에 실제 음악 재생 로직 추가 가능
        console.log('선택된 노래:', song.title);
    }, []);

    // 외부 링크로 이동
    const handleOpenLink = useCallback((link) => {
        window.open(link, '_blank', 'noopener,noreferrer');
    }, []);

    // 채팅방에 음악 공유
    const handleShareToChat = useCallback(
        async (song) => {
            // 로그인 체크
            if (!isLogin || !currentUser) {
                alert('로그인이 필요합니다.');
                return;
            }

            // 현재 채팅방 체크
            if (!currentChatRoom) {
                alert('채팅방에 먼저 입장해주세요.');
                return;
            }

            // 확인 대화상자
            const confirmed = window.confirm(
                `"${song.title}"을(를) 현재 채팅방에 공유하시겠습니까?`
            );

            if (!confirmed) {
                return;
            }

            try {
                // 음악 공유 메시지 데이터 생성
                const shareMessage = {
                    type: 'music_share',
                    text: `${currentUser.nickName}님이 ${song.title}을 공유했습니다.`,
                    musicData: {
                        title: song.title,
                        thumbnail: song.thumbnail,
                        link: song.link,
                        playlistTitle: song.playlistTitle,
                        contentId: song.contentId,
                    },
                };

                // 메시지를 JSON 문자열로 변환하여 전송
                await sendMessageToRoom(
                    currentChatRoom.name,
                    JSON.stringify(shareMessage),
                    currentUser.id,
                    currentUser.nickName
                );

                console.log('음악 공유 완료:', song.title);
            } catch (error) {
                console.error('음악 공유 오류:', error);
                alert('음악 공유에 실패했습니다. 다시 시도해주세요.');
            }
        },
        [isLogin, currentUser, currentChatRoom]
    );

    if (loading) {
        return (
            <div className='user-playlist-comp loading'>
                <p>플레이리스트 로딩 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className='user-playlist-comp error'>
                <p>{error}</p>
                <button onClick={loadPlaylistData}>다시 시도</button>
            </div>
        );
    }

    if (allSongs.length === 0) {
        return (
            <div className='user-playlist-comp empty'>
                <p>
                    {isLogin
                        ? '플레이리스트가 비어있습니다.'
                        : '로그인하여 플레이리스트를 확인하세요.'}
                </p>
            </div>
        );
    }

    return (
        <div className='user-playlist-comp'>
            <div className='playlist-header'>
                <h4>🎵 플레이리스트</h4>
                {currentSong && (
                    <div className='current-song-info'>
                        <small>재생 중: {currentSong.title}</small>
                    </div>
                )}
            </div>

            {/* 메인 플레이리스트 스와이퍼 */}
            <Swiper
                loop={allSongs.length > 1}
                spaceBetween={10}
                navigation={true}
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                modules={[FreeMode, Navigation, Thumbs]}
                className='user-playlist-swiper'
            >
                {allSongs.map((song, index) => (
                    <SwiperSlide key={`${song.contentId}-${index}`}>
                        <div className='song-card'>
                            <div className='song-thumbnail'>
                                <img
                                    src={song.thumbnail}
                                    alt={song.title}
                                    onError={(e) => {
                                        e.target.src = '/img/icon-image.png';
                                    }}
                                />
                                <div className='song-overlay'>
                                    <button
                                        className='play-btn'
                                        onClick={() => handleSongSelect(song)}
                                        title='재생'
                                    >
                                        ▶️
                                    </button>
                                    <button
                                        className='external-btn'
                                        onClick={() => handleShareToChat(song)}
                                        title='채팅으로 보내기'
                                    >
                                        🔗
                                    </button>
                                </div>
                            </div>
                            <div className='song-info'>
                                <h5 className='song-title' title={song.title}>
                                    {song.title.length > 30
                                        ? `${song.title.substring(0, 30)}...`
                                        : song.title}
                                </h5>
                                <p className='playlist-name'>{song.playlistTitle}</p>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* 썸네일 스와이퍼 */}
            {allSongs.length > 1 && (
                <Swiper
                    onSwiper={setThumbsSwiper}
                    loop={true}
                    spaceBetween={5}
                    slidesPerView={4}
                    freeMode={true}
                    watchSlidesProgress={true}
                    modules={[FreeMode, Navigation, Thumbs]}
                    className='user-playlist-thumbs'
                >
                    {allSongs.map((song, index) => (
                        <SwiperSlide key={`thumb-${song.contentId}-${index}`}>
                            <div className='thumb-card'>
                                <img
                                    src={song.thumbnail}
                                    alt={song.title}
                                    onError={(e) => {
                                        e.target.src = '/img/icon-image.png';
                                    }}
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            )}
        </div>
    );
};

export default UserPlaylist;
