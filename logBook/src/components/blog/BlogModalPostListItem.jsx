export const BlogModalPostListItem = ({ post, isSelected, onSelect }) => {
    const getThumbnailFromContent = (content) => {
        if (!content) return null;

        const match = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
        return match ? match[1] : null;
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        return isoString.replace('T', ' ').slice(0, 16);
    };

    const thumbnail = getThumbnailFromContent(post.content) || '/img/logBook_logo.png';

    return (
        <div
            className={`post-list-item ${isSelected ? 'selected-post' : ''}`}
            onClick={() => onSelect(post)}
        >
            {/* 썸네일 */}
            <div className="post-thumbnail">
                <img src={thumbnail} alt="게시글 썸네일" />
            </div>

            {/* 텍스트 영역 */}
            <div className="post-info">
                <h3 className="post-title">{post.title}</h3>

                <p className="post-content">
                    {post.content}
                    <span className="post-more">...</span>
                </p>

                <span className="post-date">{formatDate(post.createdAt)}</span>
            </div>
        </div>
    );
};

export default BlogModalPostListItem;
