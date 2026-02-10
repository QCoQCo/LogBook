import { Link } from 'react-router-dom';
import { useBlog } from '../../context';

export const PostVerticalCard = ({ layout, postId, thumbnail, title }) => {
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
                }
            }}
        >
            <div className="post-vertical-card">
                <img src={thumbnail} alt="" className="post-thumbnail" draggable={false} />
                <div className="text">
                    <h4 className="title">{title}</h4>
                </div>
            </div>
        </Link>
    );
};

export default PostVerticalCard;
