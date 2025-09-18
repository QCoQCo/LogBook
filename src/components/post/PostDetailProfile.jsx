import { Link } from 'react-router-dom';

const PostDetailProfile = ({ postOwner, isFollowing, isOwnPost, handleClickFollowBtn }) => {
    return (
        <div className='post-owner'>
            <div className='profile-left'>
                <Link
                    to={`/blog?userId=${postOwner.userId}`}
                    onClick={() => {
                        window.scrollTo(0, 0);
                    }}
                    className='profile-photo'
                >
                    <img
                        src={postOwner.profilePhoto || '/img/userProfile-ex.png'}
                        alt='프로필 사진'
                    />
                </Link>
                <div className='profile-text-area'>
                    <Link
                        to={`/blog?userId=${postOwner.userId}`}
                        onClick={() => {
                            window.scrollTo(0, 0);
                        }}
                        className='user-nickname'
                    >
                        {postOwner.nickName || postOwner.userId}
                    </Link>
                    <p className='user-introduction'>{postOwner.introduction}</p>
                </div>
            </div>
            {!isOwnPost && (
                <button
                    className={isFollowing ? 'follow-post-owner following' : 'follow-post-owner'}
                    onClick={handleClickFollowBtn}
                >
                    {isFollowing ? '팔로우 중' : '팔로우'}
                </button>
            )}
        </div>
    );
};

export default PostDetailProfile;
