import { useState } from 'react';
import { Link } from 'react-router-dom';
import './UserInfoModal.scss';

const UserInfoModal = ({ isOpen, onClose, userInfo, currentUserId, isOwnProfile = false }) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDescription, setReportDescription] = useState('');

    if (!isOpen || !userInfo) return null;

    // 팔로우/언팔로우 처리
    const handleFollowToggle = () => {
        setIsFollowing(!isFollowing);
        // TODO: 실제 팔로우 API 호출
        console.log(isFollowing ? '언팔로우' : '팔로우', userInfo.userId);
    };

    // 신고 모달 열기
    const handleReportClick = () => {
        setShowReportModal(true);
    };

    // 신고 제출
    const handleReportSubmit = () => {
        if (!reportReason.trim()) {
            alert('신고 사유를 선택해주세요.');
            return;
        }

        // TODO: 실제 신고 API 호출
        console.log('신고 제출:', {
            targetUserId: userInfo.userId,
            reason: reportReason,
            description: reportDescription,
        });

        alert('신고가 접수되었습니다.');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
        onClose();
    };

    // 신고 모달 닫기
    const handleReportModalClose = () => {
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
    };

    // 모달 배경 클릭 시 닫기
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <>
            {/* 사용자 정보 모달 */}
            <div className='user-info-modal-backdrop' onClick={handleBackdropClick}>
                <div className='user-info-modal'>
                    <div className='modal-header'>
                        <h3>사용자 정보</h3>
                        <button className='close-button' onClick={onClose}>
                            닫기
                        </button>
                    </div>

                    <div className='modal-content'>
                        <div className='user-profile-section'>
                            <div className='profile-image'>
                                <img
                                    src={userInfo.profilePhoto || '/img/userProfile-ex.png'}
                                    alt={`${userInfo.nickName}의 프로필`}
                                    onError={(e) => {
                                        e.target.src = '/img/userProfile-ex.png';
                                    }}
                                />
                                <Link
                                    to={`/blog?userId=${userInfo.userId}`}
                                    onClick={() => {
                                        onClose();
                                    }}
                                >
                                    <p>블로그 가기</p>
                                </Link>
                            </div>
                            <div className='user-details'>
                                <h4 className='user-nickname'>{userInfo.nickName}</h4>
                                <p className='user-id'>@{userInfo.userId}</p>
                                <p className='user-email'>{userInfo.userEmail}</p>
                                {userInfo.introduction && (
                                    <p className='user-introduction'>{userInfo.introduction}</p>
                                )}
                                <div className='user-dates'>
                                    <span className='join-date'>가입일: {userInfo.createdAt}</span>
                                </div>
                            </div>
                        </div>

                        {!isOwnProfile && (
                            <div className='action-buttons'>
                                <button
                                    className={`follow-button ${isFollowing ? 'following' : ''}`}
                                    onClick={handleFollowToggle}
                                >
                                    {isFollowing ? '언팔로우' : '팔로우'}
                                </button>
                                <button className='report-button' onClick={handleReportClick}>
                                    신고하기
                                </button>
                            </div>
                        )}
                        {!isOwnProfile && (
                            <div className='blog-link-area'>
                                <Link
                                    to={`/blog?userId=${userInfo.userId}`}
                                    className='blog-link-btn'
                                >
                                    <img
                                        src='/img/LogBook-Blog-Icon.png'
                                        alt='프로필의 블로그 보러가기'
                                    />
                                    <p className='tooltip'>블로그 가기</p>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 신고 모달 */}
            {showReportModal && (
                <div className='report-modal-backdrop' onClick={handleReportModalClose}>
                    <div className='report-modal' onClick={(e) => e.stopPropagation()}>
                        <div className='modal-header'>
                            <h3>사용자 신고</h3>
                            <button className='close-button' onClick={handleReportModalClose}>
                                닫기
                            </button>
                        </div>

                        <div className='modal-content'>
                            <div className='report-target'>
                                <span>
                                    신고 대상: <strong>{userInfo.nickName}</strong>
                                </span>
                            </div>

                            <div className='form-group'>
                                <label>신고 사유 *</label>
                                <select
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    required
                                >
                                    <option value=''>사유를 선택해주세요</option>
                                    <option value='spam'>스팸/광고</option>
                                    <option value='harassment'>괴롭힘/혐오발언</option>
                                    <option value='inappropriate'>부적절한 내용</option>
                                    <option value='impersonation'>사칭/가짜계정</option>
                                    <option value='other'>기타</option>
                                </select>
                            </div>

                            <div className='form-group'>
                                <label>상세 설명 (선택)</label>
                                <textarea
                                    value={reportDescription}
                                    onChange={(e) => setReportDescription(e.target.value)}
                                    placeholder='신고 사유에 대한 자세한 설명을 입력해주세요.'
                                    rows='4'
                                />
                            </div>

                            <div className='report-buttons'>
                                <button className='cancel-button' onClick={handleReportModalClose}>
                                    취소
                                </button>
                                <button className='submit-button' onClick={handleReportSubmit}>
                                    신고하기
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserInfoModal;
