import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useUserData, useAuth } from '../../context';
import * as Post from '../post';
import './PostDetail.scss';

const PostDetail = () => {
    const navigate = useNavigate();

    const { userData } = useUserData();
    const { currentUser } = useAuth();

    const [searchParam] = useSearchParams();
    const postId = parseInt(searchParam.get('postId'));

    const [currentPost, setCurrentPost] = useState(null); // post Data
    const [postOwner, setPostOwner] = useState(null); // post Owner Data
    const [isOwnPost, setIsOwnPost] = useState(false); // post Ownership check
    const [loadError, setLoadError] = useState(false); // error flag
    const [headerHeight, setHeaderHeight] = useState(0); //

    const [isFollowing, setIsFollowing] = useState(false); // temporary follow state
    const [likes, setLikes] = useState(21); // temporary likes state
    const [isLiked, setIsLiked] = useState(false);

    const postHeaderRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
        getPostData();
    }, [postId, userData]);

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
            // [Modified] Mock Data -> Real API (임시로 목록 조회 후 필터링)
            const res = await axios.get('/api/feed?page=0');
            // API는 DTO 리스트 반환: [{id, userId, title, content, tags...}, ...]
            // postId는 숫자, DTO ID는 Long(숫자)
            const post = res.data.find((p) => p.postId === postId);

            if (post && userData) {
                // DTO userId는 String, userData id는 Number일 수 있음. 비교 시 주의
                const owner = userData.find((user) => String(user.id) === String(post.userId));
                setCurrentPost(post);
                setPostOwner(owner);

                // 게시글 소유자 확인
                if (owner && currentUser && String(owner.userId) === String(currentUser.id)) {
                    setIsOwnPost(true);
                } else {
                    setIsOwnPost(false);
                }
            }
        } catch (error) {
            console.error('게시글 데이터 로딩 오류: ', error);
        }
    };

    // handlers
    const handleClickFollowBtn = () => {
        setIsFollowing((prev) => !prev);
    };

    const handleClickLike = () => {
        if (isLiked) {
            setLikes((prev) => prev - 1);
        } else {
            setLikes((prev) => prev + 1);
        }
        setIsLiked((prev) => !prev);
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
        <div id='PostDetail'>
            {currentPost && postOwner ? (
                <div className='post-wrapper'>
                    <div className='sticky-area'>
                        <Post.PostStickyUtils
                            headerHeight={headerHeight}
                            isLiked={isLiked}
                            likes={likes}
                            handleClickLike={handleClickLike}
                            handleClickShare={handleClickShare}
                        />
                    </div>
                    <div className='post-area'>
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
                        <div className='post-comments'></div>
                    </div>
                </div>
            ) : (
                <div className='post-loading'>
                    <p className='post-loading-animation'></p>
                </div>
            )}
        </div>
    );
};

export default PostDetail;
