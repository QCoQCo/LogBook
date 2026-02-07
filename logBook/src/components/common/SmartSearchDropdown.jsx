import React from 'react';
import { Link } from 'react-router-dom';
import './SmartSearchDropdown.scss';

const SmartSearchDropdown = ({ results, isLoading, onClose }) => {
    if (isLoading) {
        return (
            <div className="smart-search-dropdown loading">
                <div className="spinner"></div>
                <span>AI가 연관 검색어를 분석 중입니다...</span>
            </div>
        );
    }

    if (!results) return null;

    const { recommendedTags = [], posts = [], relatedTopics = [], recommendedPosts = [], searchSource } = results;
    const hasTags = recommendedTags.length > 0;
    const hasPosts = posts.length > 0;
    const hasRelatedTopics = relatedTopics.length > 0;
    const hasRecommendedPosts = recommendedPosts.length > 0;

    if (!hasTags && !hasPosts && !hasRelatedTopics) {
        return (
            <div className="smart-search-dropdown empty">
                <span>검색 결과가 없습니다.</span>
            </div>
        );
    }

    return (
        <div className="smart-search-dropdown">
            {/* AI Recommendation Badge */}
            {searchSource === 'AI_PRECISE_RANKING' && (
                <div className="ai-badge">
                    ✨ AI Representative Ranking & Topic Map Powered
                </div>
            )}

            {/* Section 1: Recommended Tags (Original Query Extension) */}
            {hasTags && (
                <div className="section tags-section">
                    <div className="section-title">검색어 제안</div>
                    <div className="tags-wrapper">
                        {recommendedTags.map((tag, idx) => (
                            <Link
                                key={idx}
                                to={`/feed?tag=${encodeURIComponent(tag)}`}
                                className="tag-chip"
                                onClick={onClose}
                            >
                                #{tag}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Section 2: Related Topics (Topic Map 기반 연관 주제) */}
            {hasRelatedTopics && (
                <div className="section related-topics-section">
                    <div className="section-title">함께 보면 좋은 주제</div>
                    <div className="topics-wrapper">
                        {relatedTopics.map((topic, idx) => (
                            <Link
                                key={idx}
                                to={`/feed?query=${encodeURIComponent(topic)}`}
                                className="topic-chip"
                                onClick={onClose}
                            >
                                {topic}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Section 3: All Results */}
            {hasPosts && (
                <div className="section posts-section">
                    <div className="section-title">전체 결과</div>
                    <div className="posts-wrapper">
                        {posts.map((post) => (
                            <Link
                                key={post.postId}
                                to={`/post/detail?postId=${post.postId}`}
                                className="post-item"
                                onClick={onClose}
                            >
                                <div className="post-thumb">
                                    <img
                                        src={
                                            post.thumbnail ||
                                            (() => {
                                                if (!post.content) return null;
                                                const match = post.content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
                                                return match ? match[1] : null;
                                            })() ||
                                            '/img/logBook_logo.png'
                                        }
                                        alt={post.title}
                                        onError={(e) => {
                                            e.currentTarget.src = '/img/logBook_logo.png';
                                        }}
                                    />
                                </div>
                                <div className="post-info">
                                    <div className="post-title">{post.title}</div>
                                    <div className="post-preview">
                                        {(post.content || '').slice(0, 50)}...
                                    </div>
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="post-mini-tags">
                                            {post.tags.slice(0, 3).map((t, i) => (
                                                <span key={i}>#{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartSearchDropdown;
