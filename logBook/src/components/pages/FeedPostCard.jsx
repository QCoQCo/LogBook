import React from 'react';
import { Link } from 'react-router-dom';

const FeedPostCard = React.memo(({ post, cols, dragEnabled, longPressedId }) => {
    const isInactive = post.isActive === false;

    return (
        <div className={`post-card ${isInactive ? 'post-card--inactive' : ''}`}>
            <Link
                to={isInactive ? '#' : `/post/detail?postId=${post.postId}`}
                className={`card-link ${isInactive ? 'card-link--disabled' : ''}`}
                onClick={(e) => {
                    if (isInactive) {
                        e.preventDefault();
                        return;
                    }
                    if (dragEnabled && String(longPressedId) === String(post.postId)) {
                        e.preventDefault();
                    }
                    window.scrollTo(0, 0);
                }}
            >
                {cols === 1 ? (
                    <div
                        className='card-row'
                        style={{
                            display: 'flex',
                            gap: 12,
                            alignItems: 'flex-start',
                        }}
                    >
                        <div
                            className='card-thumb'
                            style={{
                                flex: '0 0 40%',
                                maxWidth: 300,
                                height: '100%',
                            }}
                        >
                            <img
                                src={post.displayThumbnail}
                                alt={post.title || 'thumbnail'}
                                loading='lazy'
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    borderRadius: 6,
                                }}
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/img/logBook_logo.png';
                                }}
                            />
                        </div>
                        <div className='card-body' style={{ flex: 1 }}>
                            {post.authorName && (
                                <span className='card-author'>{post.authorName}</span>
                            )}
                            <h3 className='card-title'>{post.title}</h3>
                            <p className='card-excerpt'>
                                {post.excerptLong}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className='card-thumb'>
                            <img
                                src={post.displayThumbnail}
                                alt={post.title || 'thumbnail'}
                                loading='lazy'
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = '/img/logBook_logo.png';
                                }}
                            />
                        </div>
                        <div className='card-body'>
                            {post.authorName && (
                                <span className='card-author'>{post.authorName}</span>
                            )}
                            <h3 className='card-title'>{post.title}</h3>
                            <p className='card-excerpt'>
                                {post.excerptShort}
                            </p>
                        </div>
                    </>
                )}
                {isInactive && (
                    <div className='post-card__inactive-overlay'>
                        <span className='post-card__inactive-label'>접근 불가</span>
                    </div>
                )}
            </Link>
        </div>
    );
});

export default FeedPostCard;
