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

    // AI 검색 메타데이터 상태
    const [searchMetadata, setSearchMetadata] = useState({
        recommendedTags: [],
        searchSource: 'DB'
    });

    // 현재 검색 상태 저장 (무한 스크롤용)
    const [currentSearch, setCurrentSearch] = useState({ query: null, isTagSearch: false });

    // 통합 데이터 로드 함수
    const fetchPosts = useCallback(async (queryParam, isTagSearch = false) => {
        setIsMoreLoading(true);
        // 새로운 검색이 시작되면 검색 상태 업데이트
        setCurrentSearch({ query: queryParam, isTagSearch });

        try {
            let endpoint = '/posts?page=0';
            let isSearch = false;

            if (queryParam) {
                // apiClient has baseURL '/api', so we just need '/search/hybrid'
                endpoint = `/search/hybrid?query=${encodeURIComponent(queryParam)}&page=0`;
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
    }, []);

    useEffect(() => {
        // 초기 로딩 시 URL 파라미터 확인
        const params = new URLSearchParams(window.location.search);
        const search = params.get('search');
        // tag 검색은 FeedPage에서 처리하므로 여기서는 search만 확인
        if (search) {
            fetchPosts(search);
        } else if (!params.get('tag') && !params.get('query')) {
            // 아무 파라미터도 없으면 기본 포스트 로드
            fetchPosts(null);
        }
    }, [fetchPosts]);

    // 추가 로드 함수 (무한 스크롤용 - 검색 모드가 아닐 때만 동작 -> 검색 모드에서도 동작하도록 수정)
    const loadMorePosts = useCallback(async () => {
        if (isMoreLoading || !hasMore) return;

        setIsMoreLoading(true);
        try {
            const nextPage = page + 1;
            let endpoint = `/posts?page=${nextPage}`;
            let isSearch = false;

            // 저장된 검색 상태 확인
            if (currentSearch.query) {
                endpoint = `/search/hybrid?query=${encodeURIComponent(currentSearch.query)}&page=${nextPage}`;
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
