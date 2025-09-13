import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import RGL, { WidthProvider } from 'react-grid-layout';
const ReactGridLayout = WidthProvider(RGL);
import './FeedPage.scss';

const FeedPage = () => {
    const [posts, setPosts] = useState([]);
    const skipRebuildRef = useRef(false);
    const PAGE_SIZE = 20;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loadMoreRef = useRef(null);
    // long-press drag support
    const [dragEnabled, setDragEnabled] = useState(false);
    const [longPressedId, setLongPressedId] = useState(null);
    const pressTimer = useRef(null);
    useEffect(() => {
        let mounted = true;
        fetch('/data/initData.json')
            .then((r) => r.json())
            .then((data) => {
                if (!mounted) return;
                setPosts(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (!mounted) return;
                setPosts([]);
            });
        return () => (mounted = false);
    }, []);

    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(1200);
    const [cols, setCols] = useState(4);
    const [forceCols, setForceCols] = useState(4);
    const MARGIN_X = 16;
    const MARGIN_Y = 16;

    const toggleForce = (val) => {
        setForceCols(val);
        setRglKey(
            `${val != null ? `force-${val}` : 'auto'}-${cols}-${Math.floor(
                containerWidth
            )}-${Date.now()}`
        );
    };

    const computeCols = (w) => {
        if (w >= 1100) return 4;
        if (w >= 800) return 3;
        if (w >= 500) return 2;
        return 1;
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
                (it) => String(it.i) !== String(current.i) && collides(current, it)
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
        const current = Array.isArray(currentLayout)
            ? currentLayout
            : Array.isArray(gridLayoutRef.current)
            ? gridLayoutRef.current
            : [];
        try {
            // console.info(
            //     'rebuildPostsIntoGrid called, current.length=',
            //     current.length,
            //     'visiblePosts.length=',
            //     (visiblePosts || []).length,
            //     'cols=',
            //     cols
            // );
            // console.info('rebuildPostsIntoGrid current sample:', current.slice(0, 6));
        } catch (err) {}

        const existingPostMap = new Map();
        current.forEach((it) => {
            if (!String(it.i).startsWith('snippet-')) {
                existingPostMap.set(String(it.i), {
                    i: String(it.i),
                    x: Math.max(0, Math.min(cols - 1, Number(it.x || 0))),
                    y: Math.max(0, Number(it.y || 0)),
                    w: Math.max(1, Math.min(cols, Number(it.w || 1))),
                    h: Math.max(1, Number(it.h || 1)),
                    static: true,
                });
            }
        });

        const snippetEntries = current
            .filter((it) => String(it.i).startsWith('snippet-'))
            .map((it) => ({
                ...it,
                x: Math.max(0, Math.min(cols - 1, Number(it.x || 0))),
                y: Math.max(0, Number(it.y || 0)),
                w: Math.max(1, Math.min(cols, Number(it.w || 1))),
                h: Math.max(1, Number(it.h || 1)),
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
        existingPostMap.forEach((it) => {
            const sx = Number(it.x || 0);
            const sy = Number(it.y || 0);
            const sw = Math.max(1, Number(it.w || 1));
            const sh = Math.max(1, Number(it.h || 1));
            for (let dy = 0; dy < sh; dy++) {
                for (let dx = 0; dx < sw; dx++) {
                    occupied.add(`${sx + dx}:${sy + dy}`);
                }
            }
            postEntries.push(it);
        });

        const postsArr = visiblePosts || [];
        let placedCount = postEntries.length;
        let row = 0;
        let idx = 0;
        while (placedCount < postsArr.length) {
            for (let col = 0; col < cols && placedCount < postsArr.length; col++) {
                const key = `${col}:${row}`;
                if (!occupied.has(key)) {
                    while (
                        idx < postsArr.length &&
                        existingPostMap.has(String(postsArr[idx].postId))
                    ) {
                        idx++;
                    }
                    if (idx >= postsArr.length) break;
                    const post = postsArr[idx++];
                    postEntries.push({
                        i: String(post.postId),
                        x: col,
                        y: row,
                        w: 1,
                        h: 1,
                        static: true,
                    });
                    occupied.add(key);
                    placedCount++;
                }
            }
            row++;
        }

        const next = [...snippetEntries, ...postEntries];
        next.sort((a, b) => (a.y || 0) - (b.y || 0) || (a.x || 0) - (b.x || 0));
        const final = next.map((it) => ({
            ...it,
            static: String(it.i).startsWith('snippet-') ? false : true,
        }));
        try {
            // console.info(
            //     'rebuildPostsIntoGrid result.len=',
            //     final.length,
            //     'snippetEntries.len=',
            //     snippetEntries.length,
            //     'postEntries.len=',
            //     postEntries.length
            // );
            // console.info('rebuildPostsIntoGrid final sample:', final.slice(0, 8));
        } catch (err) {}
        return final;
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

    const visiblePosts = posts.slice(0, visibleCount);

    const [gridLayout, setGridLayout] = useState([]);

    const [rglKey, setRglKey] = useState(
        () => `${cols}-${Math.floor(containerWidth)}-${Date.now()}`
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
                        setVisibleCount((prev) => Math.min(posts.length, prev + PAGE_SIZE));
                    }
                });
            },
            { root: null, rootMargin: '0px', threshold: 0.1 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [posts.length]);

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
    }, [visibleCount, cols, droppedSnippets.length, gridLayout]);

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

    return (
        <div id='FeedPage'>
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
                    margin={[MARGIN_X, MARGIN_Y]}
                >
                    {visiblePosts.map((post) => (
                        <div key={String(post.postId)} className='post-card'>
                            <Link
                                to={`/post/detail?postId=${post.postId}`}
                                className='card-link'
                                onClick={(e) => {
                                    if (
                                        dragEnabled &&
                                        String(longPressedId) === String(post.postId)
                                    ) {
                                        e.preventDefault();
                                    }
                                    window.scrollTo(0, 0);
                                }}
                            >
                                {cols === 1 ? (
                                    <div
                                        className='card-row'
                                        style={{
                                            display: 'flex',
                                            gap: 12,
                                            alignItems: 'flex-start',
                                        }}
                                    >
                                        <div
                                            className='card-thumb'
                                            style={{
                                                flex: '0 0 40%',
                                                maxWidth: 300,
                                                height: '100%',
                                            }}
                                        >
                                            <img
                                                src={post.thumbnail || '/img/logBook_logo.png'}
                                                alt={post.title || 'thumbnail'}
                                                loading='lazy'
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    borderRadius: 6,
                                                }}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = '/img/logBook_logo.png';
                                                }}
                                            />
                                        </div>
                                        <div className='card-body' style={{ flex: 1 }}>
                                            <h3 className='card-title'>{post.title}</h3>
                                            <p className='card-excerpt'>
                                                {(post.content || '').slice(0, 240)}
                                                {(post.content || '').length > 240 ? '…' : ''}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className='card-thumb'>
                                            <img
                                                src={post.thumbnail || '/img/logBook_logo.png'}
                                                alt={post.title || 'thumbnail'}
                                                loading='lazy'
                                                onError={(e) => {
                                                    // fallback to local image on error
                                                    e.currentTarget.onerror = null;
                                                    e.currentTarget.src = '/img/logBook_logo.png';
                                                }}
                                            />
                                        </div>
                                        <div className='card-body'>
                                            <h3 className='card-title'>{post.title}</h3>
                                            <p className='card-excerpt'>
                                                {(post.content || '').slice(0, 120)}
                                                {(post.content || '').length > 120 ? '…' : ''}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </Link>
                        </div>
                    ))}
                </ReactGridLayout>
                <div ref={loadMoreRef} style={{ height: 1 }} />
            </div>
        </div>
    );
};

export default FeedPage;
