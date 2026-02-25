import apiClient from '../../utils/apiClient';
import { forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePost } from '../../context';

const PostDetailHeader = forwardRef(
    ({ currentPost, postOwner, isFollowing, isOwnPost, handleClickFollowBtn }, ref) => {
        const navigate = useNavigate();

        const { setPosts } = usePost();

        const handleClickDeletePost = async () => {
            if (!confirm('정말 삭제하시겠습니까?')) return;

            try {
                await apiClient.delete('/posts', {
                    data: {
                        postId: currentPost.postId,
                    },
                });

                // 서버 삭제 성공 후 로직
                alert('삭제되었습니다.');

                // 만약 전체 포스트 목록 state가 부모 컴포넌트 등에 있다면 필터링
                if (setPosts) {
                    setPosts((prev) => prev.filter((post) => post.postId !== currentPost.postId));
                }

                navigate('/feed');
                scrollToTop();
            } catch (error) {
                console.error('삭제 실패:', error);
                alert(error.response?.data?.message || '삭제 중 오류가 발생했습니다.');
            }
        };

        const scrollToTop = () => {
            window.scrollTo(0, 0);
        };

        return (
            <div className="post-header" ref={ref}>
                <div className="post-title">{currentPost.title}</div>
                <div className="post-info-area">
                    <div className="post-info-top">
                        <div className="post-info-left">
                            {postOwner.profilePhoto && (
                                <button className="profile-photo-small">
                                    <img src={postOwner.profilePhoto} alt="작성자 프로필 사진" />
                                </button>
                            )}
                            <Link
                                to={`/blog?userId=${postOwner.userId}`}
                                className="post-owner"
                                onClick={scrollToTop}
                            >
                                {postOwner.nickName}
                            </Link>
                            <span>•</span>
                            <p className="post-created-at">
                                {new Date(currentPost.createdAt).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                })}
                            </p>
                        </div>
                        {isOwnPost ? (
                            <div className="post-edit-btns">
                                <Link
                                    to={`/post/edit?postId=${currentPost.postId}`}
                                    className="edit-post-btn"
                                    onClick={scrollToTop}
                                >
                                    수정
                                </Link>
                                <button className="delete-post-btn" onClick={handleClickDeletePost}>
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
                    <div className="post-tags">
                        {[...new Set(currentPost.tags || [])].map((tag, index) => (
                            <button
                                className="tag-button"
                                onClick={() => {}}
                                key={`${tag}-${index}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    },
);

export default PostDetailHeader;
