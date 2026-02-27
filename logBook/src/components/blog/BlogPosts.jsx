import axios from 'axios';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUserId } from '../../utils/auth';

import './BlogPosts.scss';

const BlogPosts = ({ blogOwnerData }) => {
    const userId = blogOwnerData?.id;

    const [myPosts, setMyPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [searchKeyword, setSearchKeyword] = useState('');

    const pageRef = useRef(0);
    const sentinelRef = useRef(null);
    const searchInputRef = useRef(null);
    const initialFetchInProgressRef = useRef(false);

    const fetchPosts = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        const currentPage = pageRef.current;

        try {
            // 백엔드로부터 Page 객체를 ResponseEntity로 받음
            const response = await axios.get(
                `/api/posts/lists/${userId}?page=${currentPage}&size=20`,
            );

            // ResponseEntity 안의 Page 객체 구조 (data.content, data.last 등)
            const { content, last } = response.data;

            if (content && content.length > 0) {
                setMyPosts((prev) => {
                    const existingIds = new Set(prev.map((p) => p.postId));
                    const uniqueNewPosts = content.filter((p) => !existingIds.has(p.postId));
                    return [...prev, ...uniqueNewPosts];
                });

                // 백엔드가 제공하는 last 속성을 신뢰하여 hasMore 업데이트
                // last가 true이면 더 이상 데이터가 없다는 뜻
                if (last) {
                    setHasMore(false);
                }

                // 성공적으로 로드 시에만 페이지 번호 증가
                pageRef.current = currentPage + 1;
            } else {
                // 데이터가 하나도 없는 경우
                setHasMore(false);
            }
        } catch (err) {
            console.error('데이터 로딩 실패:', err);
        } finally {
            setIsLoading(false);
            setIsInitialLoading(false);
        }
    }, [userId, isLoading, hasMore]);

    // 1. 초기화 (유저 변경 시)
    useEffect(() => {
        setMyPosts([]);
        setHasMore(true);
        setIsInitialLoading(true);
        pageRef.current = 0;
        initialFetchInProgressRef.current = false;
    }, [userId]);

    // 2. 최초 실행 (중복 방지: Strict Mode 등으로 effect 2회 실행 시 1회만 요청)
    useEffect(() => {
        if (!userId) return;

        if (pageRef.current !== 0 || !hasMore || initialFetchInProgressRef.current) return;
        initialFetchInProgressRef.current = true;
        fetchPosts().finally(() => {
            initialFetchInProgressRef.current = false;
        });
    }, [fetchPosts, hasMore]);

    // 3. Intersection Observer (무한 스크롤)
    useEffect(() => {
        if (isInitialLoading || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading) {
                    fetchPosts();
                }
            },
            { threshold: 0.1 },
        );

        if (sentinelRef.current) {
            observer.observe(sentinelRef.current);
        }

        return () => observer.disconnect();
    }, [fetchPosts, isInitialLoading, hasMore, isLoading]);

    const handleChangeInput = (e) => {
        setSearchKeyword(e.target.value);
    };

    const getThumbnailFromContent = (content) => {
        if (!content) return null;
        const match = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
        return match ? match[1] : null;
    };

    const filteredPosts = myPosts.filter((post) => {
        if (!searchKeyword.trim()) return true;
        const keyword = searchKeyword.toLowerCase();
        return (
            post.title?.toLowerCase().includes(keyword) ||
            post.content?.toLowerCase().includes(keyword)
        );
    });

    return (
        <div className="blog-post-wrapper">
            <div className="blog-post-search-area">
                {myPosts.length > 0 && (
                    <input
                        className="post-search-input"
                        ref={searchInputRef}
                        onChange={handleChangeInput}
                        placeholder="게시글 검색어를 입력해주세요"
                    />
                )}
            </div>

            <div className="blog-posts-area">
                {filteredPosts.length > 0 ? (
                    <>
                        {filteredPosts.map((post) => (
                            <Link
                                to={`/post/detail?postId=${post.postId}`}
                                className="blog-post-item"
                                key={post.postId}
                                onClick={() => window.scrollTo(0, 0)}
                            >
                                <div className="blog-post-thumbnail-area">
                                    <img
                                        className="blog-post-thumbnail"
                                        src={
                                            getThumbnailFromContent(post.content) ||
                                            '/img/logBook_logo.png'
                                        }
                                        alt={post.title}
                                    />
                                </div>
                                <div className="blog-post-title">
                                    <p>{post.title}</p>
                                </div>
                            </Link>
                        ))}

                        {/* Sentinel */}
                        {hasMore && (
                            <div
                                ref={sentinelRef}
                                className="blog-post-sentinel"
                                style={{
                                    width: '100%',
                                    height: '50px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    clear: 'both',
                                }}
                            >
                                {isLoading && <p>게시글을 더 불러오는 중입니다...</p>}
                            </div>
                        )}
                    </>
                ) : (
                    !isInitialLoading && (
                        <div className="blog-post-empty">
                            <img src="/img/empty_logo.png" alt="게시글 목록 비었음" />
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default BlogPosts;
