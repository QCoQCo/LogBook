import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import RGL, { WidthProvider } from 'react-grid-layout';
import { usePost, useAuth } from '../../context';
import FeedPostCard from './FeedPostCard';
const ReactGridLayout = WidthProvider(RGL);
import './FeedPage.scss';

// [New] 피드 페이지 공통 설정 관리
const FEED_CONFIG = {
    PAGE_SIZE: 20,
    MARGIN_X: 16,
    MARGIN_Y: 16,
    COLS: {
        WIDE: 4,
        TABLET: 3,
        MOBILE: 2,
        TINY: 1,
    },
    BREAKPOINTS: {
        WIDE: 1100,
        TABLET: 800,
        MOBILE: 500,
    },
};

// [New] 스니펫 프리셋 설정
const SNIPPET_PRESETS = {
    // 필요 시 추가적인 스니펫 타입별 설정을 이곳에서 관리
    default: { w: 1, h: 1 },
};

const FeedPage = () => {
    const {
        posts,
        loadMorePosts,
        hasMore,
        isMoreLoading,
        fetchPosts,
        searchMetadata,
        feedFilter,
        setFeedFilter,
    } = usePost();
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // [New] 데이터 전처리: 렌더링 루프 내 연산을 최소화하기 위해 메모이제이션 적용
    const processedPosts = React.useMemo(() => {
        return posts.map((post) => {
            // 썸네일 추출 로직 상위 이동
            let displayThumbnail = post.thumbnail;
            if (!displayThumbnail && post.content) {
                const match = post.content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
                displayThumbnail = match ? match[1] : null;
            }
            displayThumbnail = displayThumbnail || '/img/logBook_logo.png';

            return {
                ...post,
                displayThumbnail,
                excerptLong:
                    (post.content || '').slice(0, 240) +
                    ((post.content || '').length > 240 ? '…' : ''),
                excerptShort:
                    (post.content || '').slice(0, 120) +
                    ((post.content || '').length > 120 ? '…' : ''),
            };
        });
    }, [posts]);

    // 이중 fetch 방지 (동일 params로 연속 호출 시 스킵)
    const lastFetchParamsRef = useRef(null);
    const lastFetchTimeRef = useRef(0);

    // URL 검색 파라미터 변경 감지 및 데이터 로드
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const search = params.get('search');
        const tag = params.get('tag');
        const query = params.get('query');

        const fetchKey = tag ? `tag:${tag}` : `query:${query || search || ''}:${feedFilter}`;
        const now = Date.now();
        if (lastFetchParamsRef.current === fetchKey && now - lastFetchTimeRef.current < 300) {
            return; // 300ms 이내 동일 params 중복 호출 방지
        }
        lastFetchParamsRef.current = fetchKey;
        lastFetchTimeRef.current = now;

        // Tag 검색인 경우 isTagSearch=true 전달
        if (tag) {
            setLastQuery(`#${tag}`);
            fetchPosts(tag, true); // Tag 전용 검색
        } else {
            const searchTerm = query || search;
            setLastQuery(searchTerm || '');
            fetchPosts(searchTerm, false, feedFilter); // 일반 검색 또는 필터 피드
        }
    }, [location.search, fetchPosts, feedFilter]);
    const skipRebuildRef = useRef(false);

    // [New] 새로고침 시 스크롤 최상단 강제 이동
    useLayoutEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
    }, []);

    const [visibleCount, setVisibleCount] = useState(FEED_CONFIG.PAGE_SIZE);
    const loadMoreRef = useRef(null);
    // long-press drag support
    const [dragEnabled, setDragEnabled] = useState(false);
    const [longPressedId, setLongPressedId] = useState(null);
    const pressTimer = useRef(null);

    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(1200);
    const [cols, setCols] = useState(FEED_CONFIG.COLS.WIDE);
    const [forceCols, setForceCols] = useState(FEED_CONFIG.COLS.WIDE);

    const toggleForce = (val) => {
        setForceCols(val);
        setRglKey(
            `${val != null ? `force-${val}` : 'auto'}-${cols}-${Math.floor(
                containerWidth,
            )}-${Date.now()}`,
        );
    };

    const computeCols = (w) => {
        if (w >= FEED_CONFIG.BREAKPOINTS.WIDE) return FEED_CONFIG.COLS.WIDE;
        if (w >= FEED_CONFIG.BREAKPOINTS.TABLET) return FEED_CONFIG.COLS.TABLET;
        if (w >= FEED_CONFIG.BREAKPOINTS.MOBILE) return FEED_CONFIG.COLS.MOBILE;
        return FEED_CONFIG.COLS.TINY;
    };

    const collides = (a, b) => {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    };

    const resolveCollisions = (arr, target) => {
        const layout = arr.map((it) => ({ ...it }));
        const maxIter = 2000;
        let iter = 0;
        const findById = (id) => layout.find((it) => String(it.i) === String(id));

        if (!target || target.i === undefined || target.i === null) return layout;

        const targetId = String(target.i);
        let root = findById(targetId);
        if (!root) {
            layout.push({ ...target });
            root = findById(targetId);
        } else {
            if (typeof target.x === 'number') root.x = target.x;
            if (typeof target.y === 'number') root.y = target.y;
            if (typeof target.w === 'number') root.w = target.w;
            if (typeof target.h === 'number') root.h = target.h;
        }

        const queue = [root.i];
        while (queue.length && iter++ < maxIter) {
            const currentId = queue.shift();
            const current = findById(currentId);
            if (!current) continue;

            const collisions = layout.filter(
                (it) => String(it.i) !== String(current.i) && collides(current, it),
            );

            for (const col of collisions) {
                if (String(col.i) === targetId) continue;

                const prevY = Number(col.y || 0);
                const desiredY = Number(current.y || 0) + Number(current.h || 1);
                if (prevY < desiredY) {
                    col.y = desiredY;
                    queue.push(col.i);
                }
            }
        }

        layout.sort((a, b) => (a.y || 0) - (b.y || 0) || (a.x || 0) - (b.x || 0));
        return layout;
    };

    const rebuildPostsIntoGrid = (currentLayout) => {
        const current = Array.isArray(currentLayout) ? currentLayout : gridLayoutRef.current || [];
        const nextLayout = [];
        const occupied = new Set();

        // 1. 고정된 스니펫(Snippet) 우선 배치
        current
            .filter((it) => String(it.i).startsWith('snippet-'))
            .forEach((it) => {
                const item = {
                    ...it,
                    x: Math.max(0, Math.min(cols - 1, Number(it.x || 0))),
                    y: Math.max(0, Number(it.y || 0)),
                    w: Math.max(1, Math.min(cols, Number(it.w || 1))),
                    h: Math.max(1, Number(it.h || 1)),
                    static: false,
                };
                nextLayout.push(item);
                // 점유 영역 기록
                for (let dy = 0; dy < item.h; dy++) {
                    for (let dx = 0; dx < item.w; dx++) {
                        occupied.add(`${item.x + dx}:${item.y + dy}`);
                    }
                }
            });

        // 2. 일반 포스트 순차 배치
        let row = 0;
        let col = 0;
        visiblePosts.forEach((post, index) => {
            const postId = String(post.postId);
            // 이미 배치된 레이아웃에서 위치 정보 찾기 (드래그 상태 유지용)
            const existing = current.find((it) => String(it.i) === postId);

            if (existing) {
                const item = { ...existing, static: true };
                nextLayout.push(item);
                for (let dy = 0; dy < item.h; dy++) {
                    for (let dx = 0; dx < item.w; dx++) {
                        occupied.add(`${item.x + dx}:${item.y + dy}`);
                    }
                }
            } else {
                // 비어있는 최적의 공간 찾기
                while (occupied.has(`${col}:${row}`)) {
                    col++;
                    if (col >= cols) {
                        col = 0;
                        row++;
                    }
                }
                nextLayout.push({ i: postId, x: col, y: row, w: 1, h: 1, static: true });
                occupied.add(`${col}:${row}`);
                col++;
                if (col >= cols) {
                    col = 0;
                    row++;
                }
            }
        });

        return nextLayout.sort((a, b) => a.y - b.y || a.x - b.x);
    };

    const compareLayoutToDom = (mapped, note) => {
        try {
            if (typeof window === 'undefined' || !Array.isArray(mapped)) return;
            const domItems = Array.from(document.querySelectorAll('.react-grid-item')).map((el) => {
                const dg = el.getAttribute('data-grid');
                let parsed = null;
                try {
                    parsed = dg ? JSON.parse(dg) : null;
                } catch (err) {
                    parsed = null;
                }
                return {
                    i: parsed && parsed.i ? String(parsed.i) : null,
                    parsed,
                    transform: el.style.transform,
                    top: el.style.top,
                    left: el.style.left,
                };
            });

            // console.info('compareLayoutToDom', note, 'mapped sample:', mapped.slice(0, 8));
            // console.info('compareLayoutToDom dom sample:', domItems.slice(0, 8));

            const domById = new Map(domItems.map((d) => [String(d.i), d.parsed]));
            const diffs = [];
            mapped.forEach((m) => {
                const id = String(m.i);
                const d = domById.get(id);
                if (!d) {
                    diffs.push({ i: id, mapped: m, dom: null });
                } else {
                    if (
                        Number(d.x) !== Number(m.x) ||
                        Number(d.y) !== Number(m.y) ||
                        Number(d.w) !== Number(m.w) ||
                        Number(d.h) !== Number(m.h)
                    ) {
                        diffs.push({ i: id, mapped: m, dom: d });
                    }
                }
            });
            // console.info(
            //     'compareLayoutToDom diffs.count=',
            //     diffs.length,
            //     'sample:',
            //     diffs.slice(0, 8)
            // );
        } catch (err) {
            /* ignore */
        }
    };

    useLayoutEffect(() => {
        const el = containerRef.current;
        const update = () => {
            const w = el?.clientWidth || window.innerWidth;

            setContainerWidth(w);
            setCols((prev) => {
                const c = forceCols != null ? forceCols : computeCols(w);
                return c !== prev ? c : prev;
            });
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [forceCols]);

    const visiblePosts = processedPosts.slice(0, visibleCount);

    // [New] 검색어 추적 (Empty UI 노출용)
    const [lastQuery, setLastQuery] = useState('');

    const [gridLayout, setGridLayout] = useState([]);

    const [rglKey, setRglKey] = useState(
        () => `${cols}-${Math.floor(containerWidth)}-${Date.now()}`,
    );

    const gridLayoutRef = useRef(gridLayout);
    useEffect(() => {
        gridLayoutRef.current = gridLayout;
    }, [gridLayout]);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.__gridLayout = gridLayoutRef;
                window.__compareLayoutToDom = compareLayoutToDom;
            }
        } catch (err) {}
        return () => {
            try {
                if (typeof window !== 'undefined') {
                    delete window.__gridLayout;
                    delete window.__compareLayoutToDom;
                }
            } catch (err) {}
        };
    }, []);

    useEffect(() => {
        const el = loadMoreRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // 1. 로컬에 더 보여줄게 남았으면 -> visibleCount 증가
                        if (visibleCount < posts.length) {
                            setVisibleCount((prev) =>
                                Math.min(posts.length, prev + FEED_CONFIG.PAGE_SIZE),
                            );
                        }
                        // 2. 로컬은 다 보여줬는데 서버에 더 있으면 -> fetch
                        else if (hasMore && !isMoreLoading) {
                            loadMorePosts();
                        }
                    }
                });
            },
            { root: null, rootMargin: '0px', threshold: 0.1 },
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [posts.length, visibleCount, hasMore, isMoreLoading, loadMorePosts]);

    // side panel / snippets state
    const [droppedSnippets, setDroppedSnippets] = useState([]);
    const [isDropActive, setIsDropActive] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if (!isDropActive) setIsDropActive(true);
    };

    const handleDragLeave = () => {
        if (isDropActive) setIsDropActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('text/plain') || '';
        if (!type) {
            setIsDropActive(false);
            return;
        }

        // compute grid coordinates from drop point
        const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const colWidth = (containerWidth - MARGIN_X * (cols - 1)) / cols;
        const rowH = Math.max(120, Math.floor(containerWidth / cols));
        const gx = Math.max(0, Math.min(cols - 1, Math.floor(px / (colWidth + MARGIN_X))));
        const gy = Math.max(0, Math.floor(py / (rowH + MARGIN_Y)));

        const id = `snippet-${Date.now()}`;
        const layoutItem = {
            i: id,
            x: gx,
            y: gy,
            w: Math.min(1, cols),
            h: 1,
            static: true,
        };

        // const slides = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => ({
        const slides = [1, 2, 3, 4, 5].map((n) => ({
            id: `${id}-s${n}`,
            title: `Slide ${n}`,
            src: `https://picsum.photos/seed/${id}-${n}/320/180`,
        }));

        // look up preset cfg for this snippet type and add snippet record
        const cfg = SNIPPET_PRESETS[type] || {};
        // Add snippet record first to keep state coherent
        setDroppedSnippets((s) => [...s, { id, type, cfg: { ...cfg }, slides }]);
        setIsDropActive(false);

        setTimeout(() => {
            setGridLayout((prev) => {
                const prevArr = Array.isArray(prev) ? prev : [];
                // If the item already exists, replace it; otherwise append
                const filtered = prevArr.filter((it) => String(it.i) !== String(id));
                const next = [...filtered, layoutItem];
                const resolved = resolveCollisions(next, layoutItem);
                resolved.sort((a, b) => (a.y || 0) - (b.y || 0) || (a.x || 0) - (b.x || 0));
                const mapped = resolved.map((it) => ({
                    ...it,
                    static: String(it.i).startsWith('snippet-') ? false : Boolean(it.static),
                }));
                return mapped;
            });
            setDragEnabled(true);
        }, 0);
    };

    useEffect(() => {
        if (forceMoveRef.current) {
            //console.info('Skipping layout rebuild while dragging (forceMove-Ref)');
            return;
        }

        const current = Array.isArray(gridLayoutRef.current) ? gridLayoutRef.current : [];

        const snippetEntries = current
            .filter((it) => String(it.i).startsWith('snippet-'))
            .map((it) => ({
                ...it,
                x: Math.max(0, Math.min(cols - 1, Number(it.x || 0))),
                y: Math.max(0, Number(it.y || 0)), // 괄호 수정
                w: Math.max(1, Math.min(cols, Number(it.w || 1))),
                h: Math.max(1, Number(it.h || 1)), // 괄호 수정
            }));

        const occupied = new Set();
        snippetEntries.forEach((it) => {
            const sx = Number(it.x || 0);
            const sy = Number(it.y || 0);
            const sw = Math.max(1, Number(it.w || 1));
            const sh = Math.max(1, Number(it.h || 1));
            for (let dy = 0; dy < sh; dy++) {
                for (let dx = 0; dx < sw; dx++) {
                    occupied.add(`${sx + dx}:${sy + dy}`);
                }
            }
        });

        const postEntries = [];
        const postsArr = visiblePosts || [];
        let row = 0;
        while (postEntries.length < postsArr.length) {
            for (let col = 0; col < cols && postEntries.length < postsArr.length; col++) {
                const key = `${col}:${row}`;
                if (!occupied.has(key)) {
                    const post = postsArr[postEntries.length];
                    postEntries.push({
                        i: String(post.postId),
                        x: col,
                        y: row,
                        w: 1,
                        h: 1,
                        static: true,
                    });
                    occupied.add(key);
                }
            }
            row++;
        }

        const next = [...snippetEntries, ...postEntries];
        next.sort((a, b) => (a.y || 0) - (b.y || 0) || (a.x || 0) - (b.x || 0));
        const mapped = next.map((it) => ({
            ...it,
            static: String(it.i).startsWith('snippet-') ? false : true,
        }));

        const equal =
            current.length === mapped.length &&
            current.every((it, idx) => {
                const m = mapped[idx];
                return (
                    String(it.i) === String(m.i) &&
                    Number(it.x || 0) === Number(m.x || 0) &&
                    Number(it.y || 0) === Number(m.y || 0) &&
                    Number(it.w || 1) === Number(m.w || 1) &&
                    Number(it.h || 1) === Number(m.h || 1) &&
                    Boolean(it.static) === Boolean(m.static)
                );
            });

        if (!equal) {
            const sanitizedMapped = mapped.map((item) => {
                const h = Number(item.h);
                if (!isFinite(h) || h < 1 || h > 1000) {
                    return { ...item, h: 1 };
                }
                return item;
            });
            setGridLayout(sanitizedMapped);
        }
    }, [visibleCount, cols, droppedSnippets.length, gridLayout, processedPosts]);

    const forceMoveRef = useRef(false);
    const resizeRaf = useRef(null);

    useEffect(() => {
        return () => {
            if (resizeRaf.current) cancelAnimationFrame(resizeRaf.current);
        };
    }, []);

    const layout = gridLayout;
    const handleLayoutChange = (newLayout) => {
        try {
            skipRebuildRef.current = true;
            const filled = rebuildPostsIntoGrid(Array.isArray(newLayout) ? newLayout : []);
            setGridLayout(filled);
        } finally {
            setTimeout(() => {
                skipRebuildRef.current = false;
            }, 0);
        }
    };

    const handleFilterChange = (filter) => {
        setFeedFilter(filter);
        setVisibleCount(FEED_CONFIG.PAGE_SIZE); // 탭 전환 시 가시 개수 초기화
        // URL에 검색 파라미터가 있으면 제거하고 피드로 이동
        const params = new URLSearchParams(location.search);
        if (params.get('tag') || params.get('search') || params.get('query')) {
            navigate('/feed', { replace: true });
        }
    };

    const isFilterActive = (filter) => feedFilter === filter;

    return (
        <div id='FeedPage'>
            <div className='feed-filter-tabs'>
                <button
                    type='button'
                    className={`filter-tab ${isFilterActive('all') ? 'active' : ''}`}
                    onClick={() => handleFilterChange('all')}
                >
                    전체
                </button>
                <button
                    type='button'
                    className={`filter-tab ${isFilterActive('follow') ? 'active' : ''}`}
                    onClick={() => handleFilterChange('follow')}
                >
                    팔로우
                </button>
                <button
                    type='button'
                    className={`filter-tab ${isFilterActive('liked') ? 'active' : ''}`}
                    onClick={() => handleFilterChange('liked')}
                >
                    좋아요
                </button>
            </div>
            <div className='columns-wrapper'>
                <div className='columns-controls'>
                    <button
                        type='button'
                        className={`col-btn ${forceCols === 1 ? 'active' : ''}`}
                        onClick={() => toggleForce(1)}
                        aria-label='One column'
                        title='1 column'
                    >
                        <img
                            src='/img/icon-list.svg'
                            alt='1'
                            style={{ width: 30, height: 30, display: 'block' }}
                        />
                    </button>
                    <button
                        type='button'
                        className={`col-btn ${forceCols === 4 ? 'active' : ''}`}
                        onClick={() => toggleForce(4)}
                        aria-label='Four columns'
                        title='4 columns'
                    >
                        <img
                            src='/img/icon-grid.svg'
                            alt='4'
                            style={{ width: 30, height: 30, display: 'block' }}
                        />
                    </button>
                </div>
            </div>
            {searchMetadata &&
                searchMetadata.recommendedTags &&
                searchMetadata.recommendedTags.length > 0 && (
                    <div className='ai-search-info'>
                        <div className='ai-mode-badge'>
                            <span className='sparkle-icon'>✨</span> AI 강화 검색 모드
                        </div>
                        <div className='recommended-tags'>
                            {searchMetadata.recommendedTags.map((tag) => (
                                <button
                                    key={tag}
                                    className='tag-chip'
                                    onClick={() => fetchPosts(tag)}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            <div
                className='container'
                ref={containerRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <ReactGridLayout
                    key={rglKey}
                    className='layout'
                    layout={layout}
                    cols={cols}
                    rowHeight={
                        forceCols == 4 ? Math.max(120, Math.floor(containerWidth / cols)) : 150
                    }
                    onLayoutChange={handleLayoutChange}
                    isDraggable={true}
                    draggableHandle='.post-card'
                    isResizable={true}
                    compactType={null}
                    margin={[FEED_CONFIG.MARGIN_X, FEED_CONFIG.MARGIN_Y]}
                >
                    {layout
                        .filter((l) => !l.i.startsWith('snippet-'))
                        .map((l) => {
                            const post = visiblePosts.find((p) => String(p.postId) === String(l.i));
                            if (!post) return null;
                            return (
                                <div key={l.i}>
                                    <FeedPostCard
                                        post={post}
                                        cols={cols}
                                        dragEnabled={dragEnabled}
                                        longPressedId={longPressedId}
                                    />
                                </div>
                            );
                        })}
                </ReactGridLayout>

                {/* [New] Empty State UI */}
                {!isMoreLoading && processedPosts.length === 0 && (
                    <div className='empty-state'>
                        <div className='empty-icon'>
                            {feedFilter === 'follow' || feedFilter === 'liked' ? '👤' : '🔍'}
                        </div>
                        <p className='empty-text'>
                            {feedFilter === 'follow' && !currentUser
                                ? '로그인하면 팔로우한 사용자의 게시글을 확인할 수 있습니다.'
                                : feedFilter === 'liked' && !currentUser
                                  ? '로그인하면 좋아요한 게시글을 확인할 수 있습니다.'
                                  : feedFilter === 'follow'
                                    ? '팔로우한 사용자의 게시글이 없습니다.'
                                    : feedFilter === 'liked'
                                      ? '좋아요한 게시글이 없습니다.'
                                      : lastQuery
                                        ? `"${lastQuery}"에 대한 검색 결과가 없습니다.`
                                        : '등록된 게시글이 없습니다.'}
                        </p>
                        <p className='empty-subtext'>
                            {feedFilter === 'follow' || feedFilter === 'liked'
                                ? '다른 사용자를 팔로우하거나 게시글에 좋아요를 눌러보세요.'
                                : '검색어를 변경하거나 다른 태그를 탐색해 보세요.'}
                        </p>
                    </div>
                )}

                {/* [New] Skeleton Loading UI */}
                {isMoreLoading && (
                    <div
                        className='skeleton-container'
                        style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${cols}, 1fr)`,
                            gap: FEED_CONFIG.MARGIN_X,
                            marginTop: FEED_CONFIG.MARGIN_Y,
                        }}
                    >
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className='skeleton-card'>
                                <div className='skeleton-thumb'></div>
                                <div className='skeleton-body'>
                                    <div className='skeleton-line title'></div>
                                    <div className='skeleton-line text'></div>
                                    <div className='skeleton-line text short'></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div ref={loadMoreRef} style={{ height: 1 }} />
            </div>
        </div>
    );
};

export default FeedPage;
