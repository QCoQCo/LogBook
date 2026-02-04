import { useBlog, useAuth, useUserData } from "../../context";
import { useEffect, useRef, useState } from "react";
import apiClient from "../../utils/apiClient";

const BlogUserInfo = ({ userId, blogOwnerData, isOwnBlog, onUpdate }) => {
    const [introText, setIntroText] = useState("");
    const [nickName, setNickName] = useState("");
    const [originalNickName, setOriginalNickName] = useState("");
    const [isNickNameChecked, setIsNickNameChecked] = useState(true); // 본인 닉네임은 체크된 상태로 간주
    const [nickNameMessage, setNickNameMessage] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const introTextRef = useRef();
    const fileInputRef = useRef();

    // useContext
    const { layout, elements, isBlogEditting, setIsBlogEditting, activeTab } = useBlog();
    const { currentUser, updateCurrentUser } = useAuth();
    const { updateUserInCache } = useUserData();

    const handleChangeIntroText = (e) => {
        setIntroText(e.target.value);
    };

    const handleChangeNickName = (e) => {
        setNickName(e.target.value);
        if (e.target.value === originalNickName) {
            setIsNickNameChecked(true); // 원래 닉네임과 같으면 체크 통과
            setNickNameMessage("");
        } else {
            setIsNickNameChecked(false);
            setNickNameMessage("");
        }
    };

    const handleCheckNickName = async () => {
        if (!nickName) {
            alert("닉네임을 입력해주세요.");
            return;
        }
        try {
            const response = await apiClient.post("/auth/signup/check-nickname", { nickName });
            if (response.data.exists) {
                setNickNameMessage("이미 사용 중인 닉네임입니다.");
                setIsNickNameChecked(false);
            } else {
                setNickNameMessage("사용 가능한 닉네임입니다.");
                setIsNickNameChecked(true);
            }
        } catch (error) {
            console.error("Nickname check failed:", error);
            alert("닉네임 중복 확인 중 오류가 발생했습니다.");
        }
    };

    const handleClickEditBlog = () => {
        setIsBlogEditting(true);
    };

    const handleClickConfirmBtn = async () => {
        if (!isNickNameChecked) {
            alert("닉네임 중복 확인을 해주세요.");
            return;
        }

        try {
            const formData = new FormData();

            const layoutJson = {
                layout: layout,
                elements: elements,
            };

            formData.append("introduction", introText);
            formData.append("nickName", nickName); // 닉네임 추가
            formData.append("layout", JSON.stringify(layoutJson));
            if (selectedFile) {
                formData.append("file", selectedFile);
            }

            // [수정] userId(String, loginId) 대신 blogOwnerData.id(Long, PK) 사용
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

            if (onUpdate) {
                await onUpdate();
            }
            setIsBlogEditting(false);
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("프로필 수정에 실패했습니다.");
        }
    };

    const handleClickCancelBtn = () => {
        setIsBlogEditting(false);
        setIntroText(blogOwnerData?.introduction || "");
        setNickName(blogOwnerData?.nickName || "");
        setOriginalNickName(blogOwnerData?.nickName || "");
        setIsNickNameChecked(true);
        setNickNameMessage("");
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    useEffect(() => {
        setIsBlogEditting(false);
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
        if (!url) return "/img/userProfile-ex.png";
        if (url.startsWith("http")) return url; // 외부 링크 혹은 이미 완전한 URL
        // DB에 '/img/'로 시작하는 예전 경로가 있다면 '/api'를 붙여준다.
        if (url.startsWith("/img/")) {
            return "/api" + url;
        }
        return url;
    };

    if (!blogOwnerData) {
        return null;
    } else {
        return (
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
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleFileChange}
                />
                {isBlogEditting && (
                    <button
                        className="edit-profile-photo"
                        onClick={() => fileInputRef.current.click()}
                    >
                        <img src="/img/logbook-edit.png" />
                    </button>
                )}
                <div className="user-nickname-wrapper">
                    {isBlogEditting ? (
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
                                        isNickNameChecked ? "success" : "error"
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
                        isBlogEditting
                            ? "user-introduction is-editting"
                            : isOwnBlog
                              ? "user-introduction is-my-blog"
                              : "user-introduction"
                    }
                >
                    <textarea
                        ref={introTextRef}
                        onChange={handleChangeIntroText}
                        value={introText}
                        readOnly={isBlogEditting ? "" : "readonly"}
                    ></textarea>
                </div>
                {isBlogEditting && activeTab === 1 && (
                    <div className="user-info-btns">
                        <button className="save-btn" onClick={handleClickConfirmBtn}>
                            저 장
                        </button>
                        <button className="cancel-btn" onClick={handleClickCancelBtn}>
                            취 소
                        </button>
                    </div>
                )}
                {!isBlogEditting && isOwnBlog && activeTab === 1 && (
                    <button className="edit-btn" onClick={handleClickEditBlog}>
                        내 블로그 수정하기
                    </button>
                )}
            </div>
        );
    }
};

export default BlogUserInfo;
