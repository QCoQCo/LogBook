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

    // 통합 데이터 로드 함수
    const fetchPosts = useCallback(async (queryParam) => {
        setIsMoreLoading(true);
        try {
            let endpoint = '/posts?page=0';
            let isSearch = false;

            if (queryParam) {
                // apiClient has baseURL '/api', so we just need '/search/hybrid'
                endpoint = `/search/hybrid?query=${encodeURIComponent(queryParam)}`;
                isSearch = true;
            }

            const response = await apiClient.get(endpoint);
            const data = response.data;
            let resultList = [];

            // 검색 결과 구조가 일반 피드와 다를 수 있으므로 처리 (posts 필드가 있는지, 아니면 배열인지)
            // SmartSearchDropdown을 보면 response.data에 posts, recommendedTags 등이 있음.
            if (isSearch) {
                resultList = Array.isArray(data.posts) ? data.posts : [];
                // 검색 결과는 일단 단일 페이지로 간주 (무한 스크롤 비활성화)
                setHasMore(false);
            } else {
                resultList = Array.isArray(data) ? data : [];
                if (resultList.length < 20) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            }

            setPosts(resultList);
            setPage(0);
        } catch (err) {
            console.error("Failed to fetch posts:", err);
            setPosts([]);
        } finally {
            setIsMoreLoading(false);
        }
    }, []);

    useEffect(() => {
        // 초기 로딩 시 URL 파라미터 확인
        const params = new URLSearchParams(window.location.search);
        const search = params.get('search');
        fetchPosts(search);
    }, [fetchPosts]);

    // 추가 로드 함수 (무한 스크롤용 - 검색 모드가 아닐 때만 동작)
    const loadMorePosts = useCallback(async () => {
        if (isMoreLoading || !hasMore) return;

        // URL에 검색어가 있으면 추가 로드 중단 (현재 페이징 미지원 가정)
        const params = new URLSearchParams(window.location.search);
        if (params.get('search')) return;

        setIsMoreLoading(true);
        try {
            const nextPage = page + 1;
            const response = await apiClient.get(`/posts?page=${nextPage}`);
            const newPosts = response.data;

            if (Array.isArray(newPosts) && newPosts.length > 0) {
                // 중복 제거 (postId 기준)
                setPosts((prev) => {
                    const existingIds = new Set(prev.map(p => p.postId));
                    const filtered = newPosts.filter(p => !existingIds.has(p.postId));
                    return [...prev, ...filtered];
                });
                setPage(nextPage);

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
            fetchPosts, // 노출
            hasMore,
            isMoreLoading
        }),
        [posts, setPosts, loadMorePosts, fetchPosts, hasMore, isMoreLoading]
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
