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
        searchSource: 'DB',
    });

    // 현재 검색 상태 저장 (무한 스크롤용)
    const [currentSearch, setCurrentSearch] = useState({
        query: null,
        isTagSearch: false,
        filter: null,
    });

    // 피드 필터: 'all' | 'follow' | 'liked'
    const [feedFilter, setFeedFilter] = useState('all');

    // loadMore 중복 호출 방지 (setState 비동기로 인한 race condition 대응)
    const loadMoreInProgressRef = useRef(false);

    // Race Condition: 이전 fetch 취소용
    const fetchAbortControllerRef = useRef(null);

    // Stale response 방지: 요청 버전 체크 (빠른 탭 전환 시 이전 응답이 나중에 도착해 덮어쓰는 것 방지)
    const fetchVersionRef = useRef(0);

    // 탭별 캐시 (filter -> { posts, fetchedAt })
    const feedCacheRef = useRef({});
    const FEED_CACHE_TTL_MS = 60 * 1000; // 1분
    const FEED_CACHE_TTL_LIKED_MS = 10 * 1000; // 좋아요 탭: 10초 (좋아요 상태 변경 빈도 고려)

    // 통합 데이터 로드 함수
    const fetchPosts = useCallback(
        async (queryParam, isTagSearch = false, filter = null) => {
            loadMoreInProgressRef.current = false; // 새 검색/필터 시 loadMore 가드 해제
            const effectiveFilter = filter ?? feedFilter;
            const cacheKey = queryParam
                ? `search:${queryParam}:${isTagSearch}`
                : `filter:${effectiveFilter}`;

            // 7.4: 이전 요청 취소
            if (fetchAbortControllerRef.current) {
                fetchAbortControllerRef.current.abort();
            }
            fetchAbortControllerRef.current = new AbortController();
            const signal = fetchAbortControllerRef.current.signal;

            // Stale response 방지: 이번 요청의 버전 기록
            const thisFetchVersion = ++fetchVersionRef.current;

            // 검색이 아닐 때만 캐시 사용 (필터 탭 전환)
            if (!queryParam) {
                const cached = feedCacheRef.current[cacheKey];
                const cacheTtl =
                    effectiveFilter === 'liked' ? FEED_CACHE_TTL_LIKED_MS : FEED_CACHE_TTL_MS;
                if (cached && Date.now() - cached.fetchedAt < cacheTtl) {
                    setPosts(cached.posts);
                    setCurrentSearch({ query: null, isTagSearch: false, filter: effectiveFilter });
                    setPage(0);
                    setHasMore(cached.posts.length >= 20);
                    setIsMoreLoading(false);
                    return;
                }
            }

            setPosts([]); // 로딩 중 이전 탭 데이터 노출 방지
            setIsMoreLoading(true);
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

                const response = await apiClient.get(endpoint, { signal });
                // Stale response 무시: 이 요청 이후 새 요청이 시작됐으면 적용하지 않음
                if (thisFetchVersion !== fetchVersionRef.current) return;

                const data = response.data;
                let resultList = [];

                // 검색 결과 구조가 일반 피드와 다를 수 있으므로 처리 (posts 필드가 있는지, 아니면 배열인지)
                // SmartSearchDropdown을 보면 response.data에 posts, recommendedTags 등이 있음.
                if (isSearch) {
                    // SearchResponseDto 처리
                    resultList = Array.isArray(data.posts) ? data.posts : [];
                    setSearchMetadata({
                        recommendedTags: data.recommendedTags || [],
                        searchSource: data.searchSource || 'DB',
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
                        searchSource: 'DB',
                    });
                    if (resultList.length < 20) {
                        setHasMore(false);
                    } else {
                        setHasMore(true);
                    }
                }

                setPosts(resultList);
                setPage(0);

                // 필터 탭 결과 캐시
                if (!isSearch) {
                    feedCacheRef.current[cacheKey] = {
                        posts: resultList,
                        fetchedAt: Date.now(),
                    };
                }
            } catch (err) {
                // Abort 시에는 에러 처리 생략 (새 요청으로 대체됨)
                if (
                    err?.name === 'CanceledError' ||
                    err?.name === 'AbortError' ||
                    err?.code === 'ERR_CANCELED'
                ) {
                    return;
                }
                console.error('Failed to fetch posts:', err);
                setPosts([]);
                setSearchMetadata({ recommendedTags: [], searchSource: 'DB' });
            } finally {
                // Stale/aborted 요청은 로딩 상태 변경하지 않음 (새 요청이 처리)
                if (!signal.aborted && thisFetchVersion === fetchVersionRef.current) {
                    setIsMoreLoading(false);
                }
            }
        },
        [feedFilter],
    );

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
                    const existingIds = new Set(prev.map((p) => p.postId));
                    const filtered = newPosts.filter((p) => !existingIds.has(p.postId));
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
            console.error('Failed to load more posts:', err);
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
            setFeedFilter,
        }),
        [
            posts,
            setPosts,
            loadMorePosts,
            fetchPosts,
            hasMore,
            isMoreLoading,
            feedFilter,
            setFeedFilter,
        ],
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
        [markdown, setMarkdown, postTitle, setPostTitle, postTags, setPostTags],
    );

    // 전체 값 통합
    const value = useMemo(
        () => ({
            ...postDetailValues,
            ...postEditorValues,
        }),
        [postDetailValues, postEditorValues],
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
