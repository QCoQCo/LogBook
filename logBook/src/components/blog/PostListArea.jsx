import axios from 'axios';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useBlog } from '../../context';
import { getCurrentUserId } from '../../utils/auth';

import BlogModalPostListItem from './BlogModalPostListItem';

export const PostListArea = ({ type, state, dispatch }) => {
    const { selectedPost, searchKeyword } = state;

    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [posts, setPosts] = useState([]);

    // Page 메타데이터를 관리하기 위한 ref
    const pageRef = useRef(0);
    const userIdRef = useRef(getCurrentUserId());
    const postListRef = useRef(null);
    const loadMoreRef = useRef(null);

    const { isBlogEditing } = useBlog();

    // 데이터 페칭 함수
    const loadPosts = useCallback(
        async (isInitial = false) => {
            // 로딩 중이거나 더 가져올 데이터가 없으면 중단 (초기 로딩 제외)
            if (!isInitial && (loading || !hasMore)) return;

            try {
                setLoading(true);
                const currentPage = isInitial ? 0 : pageRef.current;

                const res = await axios.get(
                    `/api/posts/lists/${userIdRef.current}?page=${currentPage}&size=20`,
                );

                // Page 객체 구조 분해 할당
                const { content, last } = res.data;

                if (isInitial) {
                    setPosts(content);
                    pageRef.current = 1;
                } else {
                    setPosts((prev) => {
                        const existingIds = new Set(prev.map((p) => p.postId));
                        const uniqueNewPosts = content.filter((p) => !existingIds.has(p.postId));
                        return [...prev, ...uniqueNewPosts];
                    });
                    pageRef.current = currentPage + 1;
                }

                // 백엔드의 last 값이 true이면 더 이상 데이터 없음
                if (last) {
                    setHasMore(false);
                }
            } catch (error) {
                console.error('게시글 조회 실패:', error);
            } finally {
                setLoading(false);
            }
        },
        [loading, hasMore],
    );

    // 1. 초기 로드 (편집 모드 및 타입 확인)
    useEffect(() => {
        if (isBlogEditing && type === 'post' && userIdRef.current) {
            setPosts([]);
            setHasMore(true);
            pageRef.current = 0;
            loadPosts(true);
        }
    }, [isBlogEditing, type]);

    // 2. Intersection Observer (무한 스크롤)
    useEffect(() => {
        if (!isBlogEditing || type !== 'post' || !hasMore || loading) return;
        if (!loadMoreRef.current || !postListRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // sentinel이 화면에 보이면 다음 페이지 로드
                if (entry.isIntersecting) {
                    loadPosts();
                }
            },
            {
                root: postListRef.current, // 스크롤 컨테이너 지정
                threshold: 0.1,
            },
        );

        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [loadPosts, isBlogEditing, type, hasMore, loading]);

    // 검색 필터링 로직
    const filteredPosts = posts.filter((post) => {
        if (!searchKeyword.trim()) return true;
        const keyword = searchKeyword.toLowerCase();
        return (
            post.title?.toLowerCase().includes(keyword) ||
            post.content?.toLowerCase().includes(keyword)
        );
    });

    return (
        <div
            className="post-list-area"
            ref={postListRef}
            style={{ overflowY: 'auto', maxHeight: '400px' }}
        >
            {/* 데이터 없음 처리 */}
            {!loading && posts.length === 0 && (
                <p className="post-empty">내가 작성한 게시글이 없습니다.</p>
            )}

            {/* 검색 결과 없음 처리 */}
            {!loading && posts.length > 0 && filteredPosts.length === 0 && (
                <p className="post-empty">검색어를 포함하는 게시글이 없습니다.</p>
            )}

            {/* 리스트 렌더링 */}
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

            {/* 로딩 인디케이터 */}
            {loading && (
                <div className="post-loading">
                    <div className="post-loading-animation" />
                </div>
            )}

            {/* 데이터 끝 알림 */}
            {!hasMore && posts.length > 0 && (
                <div className="post-end">
                    <p>모든 게시글을 불러왔어요 👋</p>
                </div>
            )}

            {/* 무한 스크롤 감지 포인트 (Sentinel) */}
            {hasMore && (
                <div
                    className="sentinel"
                    ref={loadMoreRef}
                    style={{ height: '20px', width: '100%', marginTop: '8px' }}
                />
            )}
        </div>
    );
};

export default PostListArea;
