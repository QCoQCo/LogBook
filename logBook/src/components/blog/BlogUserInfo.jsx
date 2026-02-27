import { useBlog, useAuth, useUserData } from '../../context';
import { useEffect, useRef, useState } from 'react';
import apiClient from '../../utils/apiClient';
import UserInfoModal from '../chat/UserInfoModal';
import { getCurrentUserId } from '../../utils/auth';

const BlogUserInfo = ({ blogOwnerData, isOwnBlog, onUpdate }) => {
    const [introText, setIntroText] = useState('');
    const [nickName, setNickName] = useState('');
    const [originalNickName, setOriginalNickName] = useState('');
    const [isNickNameChecked, setIsNickNameChecked] = useState(true); // 본인 닉네임은 체크된 상태로 간주
    const [nickNameMessage, setNickNameMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);

    const introTextRef = useRef();
    const fileInputRef = useRef();

    // useContext
    const {
        layout,
        setLayout,
        originLayout,
        setOriginLayout,
        elements,
        setElements,
        originElements,
        setOriginElements,
        isBlogEditing,
        setisBlogEditing,
        activeTab,
        editingSessionId,
        setEditingSessionId,
        deletedImagesUrl,
        setDeletedImagesUrl,
        colorTheme,
    } = useBlog();
    const { currentUser, updateCurrentUser } = useAuth();
    const { updateUserInCache } = useUserData();

    const handleChangeIntroText = (e) => {
        setIntroText(e.target.value);
    };

    const handleChangeNickName = (e) => {
        setNickName(e.target.value);
        if (e.target.value === originalNickName) {
            setIsNickNameChecked(true); // 원래 닉네임과 같으면 체크 통과
            setNickNameMessage('');
        } else {
            setIsNickNameChecked(false);
            setNickNameMessage('');
        }
    };

    const handleCheckNickName = async () => {
        if (!nickName) {
            alert('닉네임을 입력해주세요.');
            return;
        }
        try {
            const response = await apiClient.post('/auth/signup/check-nickname', { nickName });
            if (response.data.exists) {
                setNickNameMessage('이미 사용 중인 닉네임입니다.');
                setIsNickNameChecked(false);
            } else {
                setNickNameMessage('사용 가능한 닉네임입니다.');
                setIsNickNameChecked(true);
            }
        } catch (error) {
            console.error('Nickname check failed:', error);
            alert('닉네임 중복 확인 중 오류가 발생했습니다.');
        }
    };

    const handleClickEditBlog = () => {
        setEditingSessionId(crypto.randomUUID());

        // 깊은 복사 -> 얕은 복사를 하면 layout / elements 가 변할 때 같이 변해버림
        setOriginLayout(JSON.parse(JSON.stringify(layout)));
        setOriginElements(JSON.parse(JSON.stringify(elements)));
        setisBlogEditing(true);
    };

    const handleClickConfirmBtn = async () => {
        if (!isNickNameChecked) {
            alert('닉네임 중복 확인을 해주세요.');
            return;
        }

        try {
            const userId = blogOwnerData.id;

            // ================================
            // temp 이미지 목록 추출
            // ================================
            const tempElements = elements.filter((el) => el.meta?.tempSrc);

            const extractFileName = (url) => {
                if (!url) return null;
                const parts = url.split('/');

                return parts[parts.length - 1];
            };

            const tempFileNames = tempElements
                .map((el) => extractFileName(el.content))
                .filter(Boolean);

            // ================================
            // 1. 서버에 temp 이동 요청
            // ================================
            if (tempFileNames.length > 0) {
                await apiClient.patch(`/img/blogItems/${userId}`, {
                    editId: editingSessionId,
                    files: tempFileNames,
                });
            }

            // ===================================
            // 2. elements의 img src에서 temp 제거
            // ===================================
            const updatedElements = elements.map((el) => {
                if (el.meta?.tempSrc) {
                    const newContent = el.content.replace(
                        `/api/img/blogItems/${userId}/temp/${editingSessionId}/`,
                        `/api/img/blogItems/${userId}/`,
                    );

                    return {
                        ...el,
                        content: newContent,
                        meta: {
                            tempSrc: false,
                        },
                    };
                }
                return el;
            });

            setElements(updatedElements);

            // ================================
            // 3. 프로필 + 레이아웃 저장
            // ================================
            const formData = new FormData();

            const layoutJson = {
                layout: layout,
                elements: updatedElements,
                colorTheme: colorTheme,
            };

            formData.append('introduction', introText);
            formData.append('nickName', nickName); // 닉네임 추가
            formData.append('layout', JSON.stringify(layoutJson));
            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            // formData 형태의 requestBody를 가지고 apiClient를 통해 put method call
            const { data } = await apiClient.put(`/users/${blogOwnerData.id}`, formData);

            // 헤더·프로필 모달에 즉시 반영 (UserDataContext + AuthContext 갱신)
            const updates = {
                ...(data.profilePhoto !== undefined && { profilePhoto: data.profilePhoto || null }),
                ...(data.nickName !== undefined && { nickName: data.nickName }),
                ...(data.introduction !== undefined && { introduction: data.introduction }),
            };
            if (Object.keys(updates).length > 0) {
                updateUserInCache(blogOwnerData.id, updates);
                if (currentUser?.id === blogOwnerData.id) {
                    updateCurrentUser(updates);
                }
            }

            // ========================================================
            // 4. deletedImagesUrl state를 context에서 가져와 삭제 요청
            // ========================================================
            if (deletedImagesUrl.length > 0) {
                await apiClient.delete(`/img/blogItems/${userId}`, {
                    data: {
                        files: deletedImagesUrl,
                        sessionId: editingSessionId,
                    },
                });
            }

            if (onUpdate) {
                await onUpdate();
            }
            setisBlogEditing(false);
            setEditingSessionId(null);
            setSelectedFile(null);
            setPreviewUrl(null);
            setDeletedImagesUrl([]);
        } catch (error) {
            console.error('저장 실패:', error);
            alert('블로그 저장에 실패했습니다.');
        }
    };

    const handleClickCancelBtn = async () => {
        const userId = getCurrentUserId();

        // content 값만 추출
        const tempFilesUrl = elements
            .filter((el) => el.meta?.tempSrc) // tempSrc 있는 것만
            .map((el) => el.content) // content만 추출
            .filter(Boolean); // undefined/null 제거

        // =====================================================
        // 취소 시 서버로 전송된 temp 속성 이미지 파일들 삭제 수행
        // =====================================================
        if (tempFilesUrl.length > 0) {
            await apiClient.delete(`/img/blogItems/${userId}`, {
                data: {
                    files: tempFilesUrl,
                    sessionId: editingSessionId,
                }, // 문자열 배열 전송
            });
        }

        if (originLayout && originElements) {
            setLayout(originLayout);
            setElements(originElements);
        }
        setisBlogEditing(false);
        setIntroText(blogOwnerData?.introduction || '');
        setNickName(blogOwnerData?.nickName || '');
        setOriginalNickName(blogOwnerData?.nickName || '');
        setIsNickNameChecked(true);
        setNickNameMessage('');
        setSelectedFile(null);
        setPreviewUrl(null);
        setDeletedImagesUrl([]);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    useEffect(() => {
        setisBlogEditing(false);
    }, []);

    useEffect(() => {
        if (blogOwnerData) {
            setIntroText(blogOwnerData.introduction);
            setNickName(blogOwnerData.nickName);
            setOriginalNickName(blogOwnerData.nickName);
        }
    }, [blogOwnerData]);

    // 프로필 이미지 URL 처리 (기존 데이터 호환성 및 기본 이미지)
    const getProfileImageUrl = (url) => {
        if (!url) return '/img/userProfile-ex.png';
        if (url.startsWith('http')) return url; // 외부 링크 혹은 이미 완전한 URL
        // DB에 '/img/'로 시작하는 예전 경로가 있다면 '/api'를 붙여준다.
        if (url.startsWith('/img/')) {
            return '/api' + url;
        }
        return url;
    };

    if (!blogOwnerData) {
        return null;
    } else {
        return (
            <>
                <div className="user-info-area">
                    <div className="profile-photo-wrapper">
                        <div className="profile-photo">
                            <img
                                id="user-profile-photo"
                                src={previewUrl || getProfileImageUrl(blogOwnerData.profilePhoto)}
                                alt=""
                            />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    {isBlogEditing && (
                        <button
                            className="edit-profile-photo"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <img src="/img/logbook-edit.png" />
                        </button>
                    )}
                    <div className="user-nickname-wrapper">
                        {isBlogEditing ? (
                            <>
                                <div className="nickname-input-group">
                                    <input
                                        type="text"
                                        value={nickName}
                                        onChange={handleChangeNickName}
                                        className="edit-nickname-input"
                                    />
                                    <button
                                        className="check-nickname-btn"
                                        onClick={handleCheckNickName}
                                        disabled={nickName === originalNickName}
                                    >
                                        중복확인
                                    </button>
                                </div>
                                {nickNameMessage && (
                                    <span
                                        className={`nickname-message ${
                                            isNickNameChecked ? 'success' : 'error'
                                        }`}
                                    >
                                        {nickNameMessage}
                                    </span>
                                )}
                            </>
                        ) : (
                            <div className="user-nickname">{blogOwnerData.nickName}</div>
                        )}
                    </div>
                    <div
                        className={
                            isBlogEditing
                                ? 'user-introduction is-editting'
                                : isOwnBlog
                                  ? 'user-introduction is-my-blog'
                                  : 'user-introduction'
                        }
                    >
                        <textarea
                            ref={introTextRef}
                            onChange={handleChangeIntroText}
                            value={introText}
                            readOnly={isBlogEditing ? '' : 'readonly'}
                        ></textarea>
                    </div>
                    {isBlogEditing && activeTab === 1 && (
                        <div className="user-info-btns">
                            <button className="save-btn" onClick={handleClickConfirmBtn}>
                                저 장
                            </button>
                            <button className="cancel-btn" onClick={handleClickCancelBtn}>
                                취 소
                            </button>
                        </div>
                    )}
                    {!isBlogEditing && isOwnBlog && activeTab === 1 && (
                        <button className="edit-btn" onClick={handleClickEditBlog}>
                            내 블로그 수정하기
                        </button>
                    )}
                    {!isBlogEditing && !isOwnBlog && activeTab === 1 && (
                        <button
                            className="edit-btn profile-view-btn"
                            onClick={() => setShowProfileModal(true)}
                        >
                            프로필 보기
                        </button>
                    )}
                </div>

                {/* 타인 블로그일 때 프로필 보기 모달 */}
                {blogOwnerData && (
                    <UserInfoModal
                        isOpen={showProfileModal}
                        onClose={() => setShowProfileModal(false)}
                        userInfo={{
                            ...blogOwnerData,
                            userId:
                                blogOwnerData.loginId ??
                                blogOwnerData.userId ??
                                String(blogOwnerData.id),
                            profilePhoto: getProfileImageUrl(blogOwnerData.profilePhoto),
                        }}
                        currentUserId={currentUser?.id}
                        isOwnProfile={false}
                    />
                )}
            </>
        );
    }
};

export default BlogUserInfo;
