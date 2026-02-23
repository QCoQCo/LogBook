import { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
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

    // AI 검색 메타데이터 상태
    const [searchMetadata, setSearchMetadata] = useState({
        recommendedTags: [],
        searchSource: 'DB'
    });

    // 현재 검색 상태 저장 (무한 스크롤용)
    const [currentSearch, setCurrentSearch] = useState({ query: null, isTagSearch: false, filter: null });

    // 피드 필터: 'all' | 'follow' | 'liked'
    const [feedFilter, setFeedFilter] = useState('all');

    // loadMore 중복 호출 방지 (setState 비동기로 인한 race condition 대응)
    const loadMoreInProgressRef = useRef(false);

    // 통합 데이터 로드 함수
    const fetchPosts = useCallback(async (queryParam, isTagSearch = false, filter = null) => {
        loadMoreInProgressRef.current = false; // 새 검색/필터 시 loadMore 가드 해제
        setIsMoreLoading(true);
        const effectiveFilter = filter ?? feedFilter;
        setCurrentSearch({ query: queryParam, isTagSearch, filter: effectiveFilter });

        try {
            let endpoint = '/posts?page=0&includeInactive=true';
            let isSearch = false;

            if (effectiveFilter === 'follow' || effectiveFilter === 'liked') {
                endpoint += `&filter=${effectiveFilter}`;
            }

            if (queryParam) {
                // apiClient has baseURL '/api', so we just need '/search/hybrid'
                endpoint = `/search/hybrid?query=${encodeURIComponent(queryParam)}&page=0&includeInactive=true`;
                if (isTagSearch) {
                    endpoint += '&tagOnly=true';
                }
                isSearch = true;
            }

            const response = await apiClient.get(endpoint);
            const data = response.data;
            let resultList = [];

            // 검색 결과 구조가 일반 피드와 다를 수 있으므로 처리 (posts 필드가 있는지, 아니면 배열인지)
            // SmartSearchDropdown을 보면 response.data에 posts, recommendedTags 등이 있음.
            if (isSearch) {
                // SearchResponseDto 처리
                resultList = Array.isArray(data.posts) ? data.posts : [];
                setSearchMetadata({
                    recommendedTags: data.recommendedTags || [],
                    searchSource: data.searchSource || 'DB'
                });

                // 검색 결과도 페이징 처리 가능하도록 수정
                if (resultList.length < 20) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            } else {
                resultList = Array.isArray(data) ? data : [];
                setSearchMetadata({
                    recommendedTags: [],
                    searchSource: 'DB'
                });
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
            setSearchMetadata({ recommendedTags: [], searchSource: 'DB' });
        } finally {
            setIsMoreLoading(false);
        }
    }, [feedFilter]);

    // 초기 로딩은 FeedPage useEffect에서만 수행 (중복 요청 방지)

    // 추가 로드 함수 (무한 스크롤용 - 검색 모드가 아닐 때만 동작 -> 검색 모드에서도 동작하도록 수정)
    const loadMorePosts = useCallback(async () => {
        if (isMoreLoading || !hasMore || loadMoreInProgressRef.current) return;
        loadMoreInProgressRef.current = true;
        setIsMoreLoading(true);
        try {
            const nextPage = page + 1;
            let endpoint = `/posts?page=${nextPage}&includeInactive=true`;
            let isSearch = false;

            if (currentSearch.filter === 'follow' || currentSearch.filter === 'liked') {
                endpoint += `&filter=${currentSearch.filter}`;
            }

            // 저장된 검색 상태 확인
            if (currentSearch.query) {
                endpoint = `/search/hybrid?query=${encodeURIComponent(currentSearch.query)}&page=${nextPage}&includeInactive=true`;
                if (currentSearch.isTagSearch) {
                    endpoint += '&tagOnly=true';
                }
                isSearch = true;
            }

            const response = await apiClient.get(endpoint);
            const data = response.data;
            let newPosts = [];

            if (isSearch) {
                newPosts = Array.isArray(data.posts) ? data.posts : [];
            } else {
                newPosts = Array.isArray(data) ? data : [];
            }

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
            loadMoreInProgressRef.current = false;
            setIsMoreLoading(false);
        }
    }, [page, hasMore, isMoreLoading, currentSearch]);

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
            fetchPosts,
            hasMore,
            isMoreLoading,
            feedFilter,
            setFeedFilter
        }),
        [posts, setPosts, loadMorePosts, fetchPosts, hasMore, isMoreLoading, feedFilter, setFeedFilter]
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
