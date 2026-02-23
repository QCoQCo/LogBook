import apiClient from '../../utils/apiClient';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useUserData, useAuth } from '../../context';
import * as Post from '../post';
import './PostDetail.scss';
import { CommentContainer } from '../post/comment';

const PostDetail = () => {
    const navigate = useNavigate();

    const { userData } = useUserData();
    const { currentUser } = useAuth();

    const [searchParam] = useSearchParams();
    const postId = parseInt(searchParam.get('postId'));
    const fromAdmin = searchParam.get('fromAdmin') === '1';

    const [currentPost, setCurrentPost] = useState(null); // post Data
    const [postOwner, setPostOwner] = useState(null); // post Owner Data
    const [isOwnPost, setIsOwnPost] = useState(false); // post Ownership check
    const [loadError, setLoadError] = useState(false); // error flag
    const [headerHeight, setHeaderHeight] = useState(0); //

    const [isFollowing, setIsFollowing] = useState(false);
    const [likes, setLikes] = useState(0);
    const [isLiked, setIsLiked] = useState(false);

    const postHeaderRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        getPostData();
    }, [postId, userData, fromAdmin]);

    // currentUser 로드 시점에 isOwnPost 재계산 (본인 글일 때 팔로우 버튼 숨김)
    useEffect(() => {
        if (!postOwner) return;
        const own = !!(currentUser && String(postOwner.id) === String(currentUser.id));
        setIsOwnPost(own);
    }, [postOwner, currentUser]);

    // 팔로우 상태 조회 (로그인 + 타인 글일 때만)
    useEffect(() => {
        if (!currentUser || !postOwner || isOwnPost) return;
        const fetchFollowStatus = async () => {
            try {
                const { data } = await apiClient.get(`/users/${postOwner.id}/follow/status`);
                setIsFollowing(data?.following ?? false);
            } catch (err) {
                if (err?.response?.status !== 401) {
                    console.error('팔로우 상태 조회 실패:', err);
                }
            }
        };
        fetchFollowStatus();
    }, [currentUser, postOwner, isOwnPost]);

    useEffect(() => {
        if (!currentPost || !postOwner) {
            timeoutRef.current = setTimeout(() => {
                setLoadError(true);
            }, 5000);
        } else {
            clearTimeout(timeoutRef.current);
        }

        return () => {
            clearTimeout(timeoutRef.current);
        };
    }, [currentPost, postOwner]);

    useEffect(() => {
        if (currentPost && postOwner) {
            setHeaderHeight(postHeaderRef.current.getBoundingClientRect().height);
        }
    }, [currentPost]);

    useEffect(() => {
        if (loadError) {
            navigate('/error');
        }
    }, [loadError]);

    const getPostData = async () => {
        try {
            const params = fromAdmin ? { includeInactive: true } : {};
            const res = await apiClient.get(`/posts/${postId}`, { params });
            const post = res.data;

            if (post && userData) {
                // DTO userId는 String, userData id는 Number일 수 있음. 비교 시 주의
                const owner = userData.find((user) => String(user.id) === String(post.userId));
                setCurrentPost(post);
                setPostOwner(owner);

                // 좋아요 수, 좋아요 여부 (API 응답에 포함)
                setLikes(post.likeCount ?? 0);
                setIsLiked(post.isLiked ?? false);

                // 게시글 소유자 확인 (owner.id = DB PK, currentUser.id = 로그인 유저 PK)
                if (owner && currentUser && String(owner.id) === String(currentUser.id)) {
                    setIsOwnPost(true);
                } else {
                    setIsOwnPost(false);
                }
            }
        } catch (error) {
            console.error('게시글 데이터 로딩 오류: ', error);
        }
    };

    const handleClickFollowBtn = async () => {
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }
        if (!postOwner || isOwnPost) return;
        try {
            if (isFollowing) {
                await apiClient.delete(`/users/${postOwner.id}/follow`);
                setIsFollowing(false);
            } else {
                await apiClient.post(`/users/${postOwner.id}/follow`);
                setIsFollowing(true);
            }
        } catch (err) {
            const msg = err?.response?.data?.message || '처리 중 오류가 발생했습니다.';
            if (err?.response?.status === 403) {
                alert('로그인이 필요합니다.');
            } else {
                alert(msg);
            }
        }
    };

    const handleClickLike = async () => {
        if (!currentUser) {
            alert('로그인이 필요합니다.');
            return;
        }
        try {
            if (isLiked) {
                const { data } = await apiClient.delete(`/posts/${postId}/like`);
                setLikes(data?.likeCount ?? likes - 1);
                setIsLiked(false);
            } else {
                const { data } = await apiClient.post(`/posts/${postId}/like`);
                setLikes(data?.likeCount ?? likes + 1);
                setIsLiked(true);
            }
        } catch (err) {
            const msg = err?.response?.data?.message || '처리 중 오류가 발생했습니다.';
            if (err?.response?.status === 403) {
                alert('로그인이 필요합니다.');
            } else {
                alert(msg);
            }
        }
    };

    const handleClickShare = async () => {
        const currentUrl = window.location.href;

        try {
            await navigator.clipboard.writeText(currentUrl);
        } catch (error) {
            console.error('URL 복사에 실패했습니다:', error);
        }
    };

    return (
        <div id="PostDetail">
            {currentPost && postOwner ? (
                <div
                    className={`post-wrapper ${currentPost.isActive === false ? 'post-wrapper--inactive' : ''}`}
                >
                    {currentPost.isActive === false && (
                        <div className="post-inactive-banner" role="status">
                            비활성화된 글입니다. 관리자 페이지에서만 조회 가능합니다.
                        </div>
                    )}
                    <div className="post-wrapper__content">
                        <div className="sticky-area">
                            <Post.PostStickyUtils
                                headerHeight={headerHeight}
                                isLiked={isLiked}
                                likes={likes}
                                handleClickLike={handleClickLike}
                                handleClickShare={handleClickShare}
                            />
                        </div>
                        <div className="post-area">
                            <Post.PostDetailHeader
                                ref={postHeaderRef}
                                currentPost={currentPost}
                                postOwner={postOwner}
                                isOwnPost={isOwnPost}
                                isFollowing={isFollowing}
                                handleClickFollowBtn={handleClickFollowBtn}
                            />
                            <Post.PostViewer markdown={currentPost.content} />
                            <Post.PostDetailProfile
                                postOwner={postOwner}
                                isFollowing={isFollowing}
                                isOwnPost={isOwnPost}
                                handleClickFollowBtn={handleClickFollowBtn}
                            />
                            <CommentContainer postId={postId} currentUser={currentUser} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="post-loading">
                    <p className="post-loading-animation"></p>
                </div>
            )}
        </div>
    );
};

export default PostDetail;
