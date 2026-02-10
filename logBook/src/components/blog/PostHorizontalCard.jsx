import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useBlog } from '../../context';

export const PostHorizontalCard = ({ layout, postId, thumbnail, title, content }) => {
    const { isBlogEditing } = useBlog();
    const to = `/post/detail?postId=${postId}`;

    useEffect(() => {
        console.log('dafdsafasdf');
        console.log(title, content);
    }, []);

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
            <div className="post-horizontal-inner">
                <img src={thumbnail} alt="" className="post-thumbnail" draggable={false} />
                <div className="text">
                    <h4 className="title">{title}</h4>
                    <p className="content">{content}</p>
                </div>
            </div>
        </Link>
    );
};

export default PostHorizontalCard;
