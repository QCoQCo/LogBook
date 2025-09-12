import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useLogBook } from '../../context/LogBookContext';
import * as Post from '../post';
import './PostDetail.scss';

const PostDetail = () => {
    const navigate = useNavigate();

    const { userData } = useLogBook();

    const [searchParam] = useSearchParams();
    const postId = parseInt(searchParam.get('postId'));

    const [currentPost, setCurrentPost] = useState(null);
    const [postOwner, setPostOwner] = useState(null);
    const [loadError, setLoadError] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);

    const [likes, setLikes] = useState(21); // temporary likes feature
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
            const res = await axios.get('/data/initData.json');
            const post = res.data.find((p) => p.postId === postId);

            if (post && userData) {
                const owner = userData.find((user) => user.id === post.userId);
                setCurrentPost(post);
                setPostOwner(owner);
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
                            isFollowing={isFollowing}
                            handleClickFollowBtn={handleClickFollowBtn}
                        />
                        <Post.PostViewer markdown={currentPost.content} />
                        <Post.PostDetailProfile postOwner={postOwner} />
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
