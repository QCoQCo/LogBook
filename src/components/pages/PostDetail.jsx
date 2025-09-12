import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useLogBook } from '../../context/LogBookContext';
import * as Post from '../post';
import './PostDetail.scss';

const PostDetail = () => {
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

        timeoutRef.current = setTimeout(() => {
            if (!currentPost) {
                setLoadError(true);
            }
        }, 5000);

        return () => {
            clearTimeout(timeoutRef.current);
        };
    }, [postId, userData]);

    useEffect(() => {
        if (currentPost && postOwner) {
            setHeaderHeight(postHeaderRef.current.getBoundingClientRect().height);
        }
    }, [currentPost]);

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
                        <div className='sticky-utils' style={{ marginTop: `${headerHeight}px` }}>
                            <div className='utils-like'>
                                <button
                                    className={isLiked ? 'like-btn liked' : 'like-btn'}
                                    onClick={handleClickLike}
                                >
                                    <svg width='24' height='24' viewBox='0 0 24 24'>
                                        <path
                                            fill='currentColor'
                                            d='M18 1l-6 4-6-4-6 5v7l12 10 12-10v-7z'
                                        ></path>
                                    </svg>
                                </button>
                                <p>{likes}</p>
                            </div>
                            <button className='share-btn' onClick={handleClickShare}>
                                <svg width='24' height='24' viewBox='0 0 24 24' class='share'>
                                    <path
                                        fill='currentColor'
                                        d='M5 7c2.761 0 5 2.239 5 5s-2.239 5-5 5-5-2.239-5-5 2.239-5 5-5zm11.122 12.065c-.073.301-.122.611-.122.935 0 2.209 1.791 4 4 4s4-1.791 4-4-1.791-4-4-4c-1.165 0-2.204.506-2.935 1.301l-5.488-2.927c-.23.636-.549 1.229-.943 1.764l5.488 2.927zm7.878-15.065c0-2.209-1.791-4-4-4s-4 1.791-4 4c0 .324.049.634.122.935l-5.488 2.927c.395.535.713 1.127.943 1.764l5.488-2.927c.731.795 1.77 1.301 2.935 1.301 2.209 0 4-1.791 4-4z'
                                    ></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className='post-area'>
                        <div className='post-header' ref={postHeaderRef}>
                            <div className='post-title'>{currentPost.title}</div>
                            <div className='post-info-area'>
                                <div className='post-info-top'>
                                    <div className='post-info-left'>
                                        <Link
                                            to={`/blog?userId=${postOwner.userId}`}
                                            className='post-owner'
                                        >
                                            {postOwner.nickName}
                                        </Link>
                                        <span>•</span>
                                        <p className='post-created-at'>
                                            {new Date(currentPost.createdAt).toLocaleDateString(
                                                'ko-KR',
                                                {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                }
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        className={
                                            isFollowing
                                                ? 'follow-post-owner following'
                                                : 'follow-post-owner'
                                        }
                                        onClick={handleClickFollowBtn}
                                    >
                                        {isFollowing ? '팔로우 중' : '팔로우'}
                                    </button>
                                </div>
                                <div className='post-tags'>
                                    {currentPost.tags.map((tag) => (
                                        <button className='tag-button' onClick={() => {}} key={tag}>
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Post.PostViewer markdown={currentPost.content} />
                        <div className='post-owner'></div>
                        <div className='post-comments'></div>
                    </div>
                </div>
            ) : !loadError ? (
                <div className='post-loading'>
                    <p className='post-loading-animation'></p>
                </div>
            ) : (
                <div className='post-load-error'>
                    <img src='/img/logbook_error.png' alt='에러 이미지' />
                </div>
            )}
        </div>
    );
};

export default PostDetail;
