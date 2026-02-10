import { Link } from 'react-router-dom';
import { useBlog } from '../../context';

export const PostImageOnly = ({ layout, postId, thumbnail }) => {
    const { isBlogEditing } = useBlog();
    const to = `/post/detail?postId=${postId}`;

    return (
        <Link
            to={to}
            className={`post-preview layout-${layout.toLowerCase()}`}
            draggable={false}
            onClick={(e) => {
                if (isBlogEditing) {
                    e.preventDefault();
                } else {
                    window.scrollTo(0, 0);
                }
            }}
        >
            <img src={thumbnail} alt="" className="post-thumbnail" draggable={false} />
        </Link>
    );
};

export default PostImageOnly;
