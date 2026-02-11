import axios from 'axios';
import { useRef, useState, useEffect } from 'react';
import { useBlog } from '../../context';
import { getCurrentUserId } from '../../utils/auth';

import BlogModalPostListItem from './BlogModalPostListItem';

export const PostListArea = ({ type, state, dispatch }) => {
    const { selectedPost, searchKeyword } = state;

    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(0);

    const { isBlogEditing } = useBlog();

    const userIdRef = useRef(null);
    const postListRef = useRef(null);
    const loadMoreRef = useRef(null);

    const loadingRef = useRef(false);
    const hasMoreRef = useRef(true);

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);

    useEffect(() => {
        userIdRef.current = getCurrentUserId();
    }, []);

    const fetchUserPosts = async (userId, page = 0, size = 20) => {
        try {
            const res = await axios.get(`/api/posts/lists/${userId}?page=${page}&size=${size}`);
            return res.data;
        } catch (error) {
            throw new Error('게시글 조회 실패');
        }
    };

    const loadPosts = async () => {
        if (!hasMoreRef.current || loadingRef.current) return;

        try {
            setLoading(true);
            const data = await fetchUserPosts(userIdRef.current, page);

            if (data.length === 0) {
                setHasMore(false);
                return;
            }

            setPosts((prev) => [...prev, ...data]);
        } finally {
            setLoading(false);
        }
    };

    const filteredPosts = posts.filter((post) => {
        if (!searchKeyword.trim()) return true;

        const keyword = searchKeyword.toLowerCase();

        return (
            post.title?.toLowerCase().includes(keyword) ||
            post.content?.toLowerCase().includes(keyword)
        );
    });

    useEffect(() => {
        if (!isBlogEditing || type !== 'post') return;
        if (!userIdRef.current) return;

        loadPosts();
    }, [page, isBlogEditing, type]);

    useEffect(() => {
        if (!isBlogEditing) return;
        if (type !== 'post') return;
        if (posts.length === 0) return;
        if (!loadMoreRef.current || !postListRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current) {
                    setPage((prev) => prev + 1);
                }
            },
            {
                root: postListRef.current,
                threshold: 0.1,
            },
        );

        observer.observe(loadMoreRef.current);

        return () => observer.disconnect();
    }, [posts.length, isBlogEditing, type]);

    return (
        <div className="post-list-area" ref={postListRef}>
            {!loading && posts.length === 0 && (
                <p className="post-empty">내가 작성한 게시글이 없습니다.</p>
            )}

            {!loading && posts.length > 0 && filteredPosts.length === 0 && (
                <p className="post-empty">검색어를 포함하는 게시글이 없습니다.</p>
            )}

            {filteredPosts.map((post) => (
                <BlogModalPostListItem
                    key={post.postId}
                    post={post}
                    isSelected={selectedPost?.postId === post.postId}
                    onSelect={() => {
                        dispatch({
                            type: 'SET_SELECTED_POST',
                            payload: post,
                        });
                    }}
                />
            ))}

            {loading && (
                <div className="post-loading">
                    <div className="post-loading-animation" />
                </div>
            )}

            {!hasMore && filteredPosts.length > 0 && (
                <div className="post-end">
                    <p>모든 게시글을 불러왔어요 👋</p>
                </div>
            )}

            {posts.length > 0 && hasMore && (
                <div
                    className="sentinel"
                    ref={loadMoreRef}
                    style={{ height: '20px', marginTop: '8px' }}
                />
            )}
        </div>
    );
};

export default PostListArea;
