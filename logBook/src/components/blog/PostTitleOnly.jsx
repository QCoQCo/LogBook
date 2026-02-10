import { Link } from 'react-router-dom';
import { useBlog } from '../../context';

export const PostTitleOnly = ({ layout, postId, title }) => {
    const { isBlogEditing } = useBlog();

    const to = `/post/detail?postId=${postId}`;

    return (
        <Link
            to={to}
            className={`post-preview layout-${layout.toLowerCase()}`}
            draggable={false}
            onClick={(e) => {
                if (isBlogEditing) {
                    e.preventDefault(); // 라우팅 차단
                }
            }}
        >
            <p>{title}</p>
        </Link>
    );
};

export default PostTitleOnly;
