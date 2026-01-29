import { forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePost } from '../../context';

const PostDetailHeader = forwardRef(
    ({ currentPost, postOwner, isFollowing, isOwnPost, handleClickFollowBtn }, ref) => {
        const { setPosts } = usePost();

        const navigate = useNavigate();

        const handleClickDeletePost = () => {
            if (confirm('정말 삭제하시겠습니까?')) {
                setPosts((prev) => prev.filter((post) => post.postId !== currentPost.postId));
                navigate(-1);
                scrollToTop();
            }
        };

        const scrollToTop = () => {
            window.scrollTo(0, 0);
        };

        return (
            <div className='post-header' ref={ref}>
                <div className='post-title'>{currentPost.title}</div>
                <div className='post-info-area'>
                    <div className='post-info-top'>
                        <div className='post-info-left'>
                            {postOwner.profilePhoto && (
                                <button className='profile-photo-small'>
                                    <img src={postOwner.profilePhoto} alt='작성자 프로필 사진' />
                                </button>
                            )}
                            <Link
                                to={`/blog?userId=${postOwner.userId}`}
                                className='post-owner'
                                onClick={scrollToTop}
                            >
                                {postOwner.nickName}
                            </Link>
                            <span>•</span>
                            <p className='post-created-at'>
                                {new Date(currentPost.createdAt).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                })}
                            </p>
                        </div>
                        {isOwnPost ? (
                            <div className='post-edit-btns'>
                                <Link
                                    to={`/post/edit?postId=${currentPost.postId}`}
                                    className='edit-post-btn'
                                    onClick={scrollToTop}
                                >
                                    수정
                                </Link>
                                <button className='delete-post-btn' onClick={handleClickDeletePost}>
                                    삭제
                                </button>
                            </div>
                        ) : (
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
                        )}
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
        );
    }
);

export default PostDetailHeader;
