import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

const PostDetailHeader = forwardRef(
    ({ currentPost, postOwner, isFollowing, handleClickFollowBtn }, ref) => {
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
                            <Link to={`/blog?userId=${postOwner.userId}`} className='post-owner'>
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
                        <button
                            className={
                                isFollowing ? 'follow-post-owner following' : 'follow-post-owner'
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
        );
    }
);

export default PostDetailHeader;
