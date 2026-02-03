import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useEffect } from 'react';
import apiClient from '../utils/apiClient';

// PostContext 생성
const PostContext = createContext();

export const PostProvider = ({ children }) => {
    // Post Detail 관련 상태
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isMoreLoading, setIsMoreLoading] = useState(false);

    useEffect(() => {
        let mounted = true;
        // page=0 (초기 100개) 로드
        apiClient.get('/feed?page=0')
            .then((response) => {
                if (!mounted) return;
                const data = response.data;
                const initialPosts = Array.isArray(data) ? data : [];
                setPosts(initialPosts);
                // 만약 처음부터 20개 미만이면 더 볼 것도 없음
                if (initialPosts.length < 20) {
                    setHasMore(false);
                }
            })
            .catch(() => {
                if (!mounted) return;
                setPosts([]);
            });
        return () => (mounted = false);
    }, []);

    // 추가 로드 함수 (무한 스크롤용)
    const loadMorePosts = useCallback(async () => {
        if (isMoreLoading || !hasMore) return;

        setIsMoreLoading(true);
        try {
            const nextPage = page + 1;
            const response = await apiClient.get(`/feed?page=${nextPage}`);
            const newPosts = response.data;

            if (Array.isArray(newPosts) && newPosts.length > 0) {
                setPosts((prev) => [...prev, ...newPosts]); // 기존 목록 뒤에 붙이기
                setPage(nextPage); // 페이지 번호 증가 (기억)

                // 가져온 게 20개 미만이면 이제 끝난 것임
                if (newPosts.length < 20) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("Failed to load more posts:", err);
        } finally {
            setIsMoreLoading(false);
        }
    }, [page, hasMore, isMoreLoading]);

    // Post Editor 관련 상태
    const [markdown, setMarkdown] = useState('');
    const [postTitle, setPostTitle] = useState('');
    const [postTags, setPostTags] = useState([]);

    // Post Detail 관련 값들
    const postDetailValues = useMemo(
        () => ({
            posts,
            setPosts,
            loadMorePosts,
            hasMore,
            isMoreLoading
        }),
        [posts, setPosts, loadMorePosts, hasMore, isMoreLoading]
    );

    // Post Editor 관련 값들
    const postEditorValues = useMemo(
        () => ({
            markdown,
            setMarkdown,
            postTitle,
            setPostTitle,
            postTags,
            setPostTags,
        }),
        [markdown, setMarkdown, postTitle, setPostTitle, postTags, setPostTags]
    );

    // 전체 값 통합
    const value = useMemo(
        () => ({
            ...postDetailValues,
            ...postEditorValues,
        }),
        [postDetailValues, postEditorValues]
    );

    return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
};

export const usePost = () => {
    const context = useContext(PostContext);
    if (!context) {
        throw new Error('usePost must be used within a PostProvider');
    }

    return context;
};
