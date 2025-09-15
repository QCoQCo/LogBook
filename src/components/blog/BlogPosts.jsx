import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePost } from '../../context';

const BlogPosts = ({ blogOwnerData }) => {
    // post Context
    const { posts } = usePost();

    // states
    const [blogPosts, setBlogPosts] = useState(null);

    useEffect(() => {
        if (blogOwnerData) {
            setBlogPosts(posts.filter((post) => post.userId === blogOwnerData.id));
        }
    }, [posts, blogOwnerData]);

    return (
        <div className='blog-post-wrapper'>
            <div className='blog-posts-area'>
                {blogPosts &&
                    blogPosts.map((post) => (
                        <Link
                            to={`/post/detail?postId=${post.postId}`}
                            className='blog-post-item'
                            key={post.postId}
                            onClick={() => {
                                window.scrollTo(0, 0);
                            }}
                        >
                            <div className='blog-post-thumbnail'>
                                <img
                                    className='blog-post-thumbnail'
                                    src={post.thumbnail || '/img/logBook_logo.png'}
                                    alt={post.title}
                                />
                            </div>
                            <div className='blog-post-title'>
                                <p>{post.title}</p>
                            </div>
                        </Link>
                    ))}
            </div>
        </div>
    );
};

export default BlogPosts;
