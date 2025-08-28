import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/LogBookContext';
import * as Common from '../common';
import SwiperFeatureControls from '../common/SwiperFeatureControls';
import SimpleSwiper from '../common/SimpleSwiper';
import ReactGridLayout from 'react-grid-layout';
import './HomePage.scss';

const HomePage = () => {
    const { isLogin } = useAuth();
    const [posts, setPosts] = useState([]);
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
                // keep safe array
                setPosts(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (!mounted) return;
                setPosts([]);
            });
        return () => (mounted = false);
    }, []);

    // cleanup press timer on unmount
    useEffect(() => {
        return () => {
            if (pressTimer.current) {
                clearTimeout(pressTimer.current);
                pressTimer.current = null;
            }
        };
    }, []);

    // responsive cols and container width
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(1200);
    const [cols, setCols] = useState(4);

    const computeCols = (w) => {
        // breakpoints tuned to container width
        if (w >= 1100) return 4;
        if (w >= 800) return 3;
        if (w >= 500) return 2;
        return 1;
    };

    useLayoutEffect(() => {
        let mounted = true;
        let ro = null;
        let resizeTimer = null;
        let rafId = null;

        const updateFromWidth = (w) => {
            if (!mounted) return;
            setContainerWidth(w);
            setCols((prev) => {
                const c = computeCols(w);
                if (c !== prev) return c;
                return prev;
            });
        };

        const debouncedUpdate = (w) => {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => updateFromWidth(w), 100);
        };

        // attempt to setup observer; if ref not ready, retry on next frame
        const setupObserverWhenReady = () => {
            const el = containerRef.current;
            if (el) {
                // initial measurement
                updateFromWidth(el.clientWidth || window.innerWidth);

                if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
                    ro = new ResizeObserver((entries) => {
                        const e = entries[0];
                        if (!e) return;
                        debouncedUpdate(e.contentRect.width);
                    });
                    ro.observe(el);
                }
                return;
            }
            // retry next frame until mounted or ref exists
            if (mounted) rafId = requestAnimationFrame(setupObserverWhenReady);
        };

        setupObserverWhenReady();

        // window resize fallback
        const onWindowResize = () =>
            debouncedUpdate(containerRef.current?.clientWidth || window.innerWidth);
        window.addEventListener('resize', onWindowResize);

        return () => {
            mounted = false;
            window.removeEventListener('resize', onWindowResize);
            if (ro) ro.disconnect();
            if (resizeTimer) clearTimeout(resizeTimer);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);

    // infinite scroll: load more when sentinel visible
    useEffect(() => {
        let obs = null;
        let rafId = null;
        let mounted = true;

        const attachObserver = () => {
            const el = loadMoreRef.current;
            if (!el) {
                if (mounted) rafId = requestAnimationFrame(attachObserver);
                return;
            }

            const onIntersect = (entries) => {
                const e = entries[0];
                if (!e || !e.isIntersecting) return;
                setVisibleCount((prev) => {
                    if (prev >= posts.length) return prev;
                    return Math.min(posts.length, prev + PAGE_SIZE);
                });
            };

            if ('IntersectionObserver' in window) {
                obs = new IntersectionObserver(onIntersect, {
                    root: null,
                    rootMargin: '200px',
                    threshold: 0.1,
                });
                obs.observe(el);
            } else {
                // fallback: listen to scroll
                const onScroll = () => {
                    if (!loadMoreRef.current) return;
                    const rect = loadMoreRef.current.getBoundingClientRect();
                    if (rect.top - window.innerHeight < 200) {
                        setVisibleCount((prev) => {
                            if (prev >= posts.length) return prev;
                            return Math.min(posts.length, prev + PAGE_SIZE);
                        });
                    }
                };
                window.addEventListener('scroll', onScroll);
                onScroll();
                // cleanup for fallback
                const cleanupFallback = () => window.removeEventListener('scroll', onScroll);
                // ensure cleanup will be called in outer return
                return cleanupFallback;
            }
        };

        attachObserver();

        return () => {
            mounted = false;
            if (rafId) cancelAnimationFrame(rafId);
            if (obs) obs.disconnect();
        };
    }, [posts]);

    const visiblePosts = posts.slice(0, visibleCount);
    // persisted layout so user moves are kept
    const [gridLayout, setGridLayout] = useState([]);

    // side panel state (우측 패널 열림 여부)
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    // drag & drop snippets state
    const [droppedSnippets, setDroppedSnippets] = useState([]);
    const [isDropActive, setIsDropActive] = useState(false);
    const SNIPPET_MIME = 'application/x-logbook-snippet';

    const handleDragStart = (e, type) => {
        // use a custom mime so normal element drags don't accidentally create snippets
        try {
            e.dataTransfer.setData(SNIPPET_MIME, type);
            e.dataTransfer.effectAllowed = 'copy';
        } catch (err) {
            // some browsers may restrict custom types; fallback to text/plain
            e.dataTransfer.setData('text/plain', type);
            e.dataTransfer.effectAllowed = 'copy';
        }
    };

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
        // read our custom mime first; ignore other drops
        const type = e.dataTransfer.getData(SNIPPET_MIME) || '';
        if (type) {
            const rect = containerRef.current?.getBoundingClientRect();
            const x = rect ? e.clientX - rect.left : 0;
            const y = rect ? e.clientY - rect.top : 0;
            // compute grid coords using RGL margins so placement matches visual grid
            const MARGIN_X = 16;
            const MARGIN_Y = 16;
            const colWidth = (containerWidth - MARGIN_X * (cols - 1)) / cols;
            const rowH = Math.max(120, Math.floor(containerWidth / cols));
            const gx = Math.min(Math.max(0, Math.floor(x / (colWidth + MARGIN_X))), cols - 1);
            // place new drops at the top row so they appear first
            const gy = 0;

            const id = `snippet-${Date.now()}`;
            const layoutItem = { i: id, x: gx, y: gy, w: 1, h: 1 };

            setGridLayout((prev) => {
                const next = [...prev, layoutItem];
                // sort so layout array reflects spatial order (helps visual predictability)
                next.sort((a, b) => a.y - b.y || a.x - b.x);
                return next;
            });
            // enable dragging so user can immediately pick up the newly added item
            setDragEnabled(true);
            setDroppedSnippets((s) => [...s, { id, type }]);
        }
        setIsDropActive(false);
    };

    const removeDropped = (id) => {
        setDroppedSnippets((s) => s.filter((it) => it.id !== id));
        setGridLayout((prev) => prev.filter((it) => String(it.i) !== String(id)));
    };

    // ensure layout has entries for newly visible posts (append only)
    useEffect(() => {
        if (!visiblePosts || visiblePosts.length === 0) return;
        setGridLayout((prev) => {
            const next = [...prev];
            // ensure each visible post has a layout entry (by id)
            visiblePosts.forEach((p, idx) => {
                const id = String(p.postId || idx);
                if (!next.find((it) => String(it.i) === id)) {
                    next.push({
                        i: id,
                        x: idx % cols,
                        y: Math.floor(idx / cols),
                        w: 1,
                        h: 1,
                    });
                }
            });
            return next;
        });
    }, [visiblePosts.length, cols]);

    // start press timer to enable drag after duration
    const lastPointer = useRef({ x: 0, y: 0 });
    const lastPointerButton = useRef(0);
    const lastPointerType = useRef('mouse');
    const startPress = (id, el, pointer) => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        if (pointer) lastPointer.current = pointer;
        // record button/type if available
        if (pointer && pointer.button !== undefined) lastPointerButton.current = pointer.button;
        console.log('startPress');
        pressTimer.current = setTimeout(() => {
            setDragEnabled(true);
            setLongPressedId(id);
            console.log('startPress enabled');
            // Wait one frame so React/ReactGridLayout sees isDraggable change
            requestAnimationFrame(() => {
                try {
                    // prefer the react-grid-item wrapper so RGL receives the events
                    let target = null;
                    if (el && el.closest) target = el.closest('.react-grid-item');
                    if (!target)
                        target = document.elementFromPoint(
                            lastPointer.current.x,
                            lastPointer.current.y
                        );
                    if (target) {
                        const down = new MouseEvent('mousedown', {
                            bubbles: true,
                            cancelable: true,
                            clientX: lastPointer.current.x,
                            clientY: lastPointer.current.y,
                            button: 0,
                        });
                        target.dispatchEvent(down);

                        // small move to kick off drag
                        const move = new MouseEvent('mousemove', {
                            bubbles: true,
                            cancelable: true,
                            clientX: lastPointer.current.x + 1,
                            clientY: lastPointer.current.y + 1,
                        });
                        target.dispatchEvent(move);
                    }
                } catch (err) {
                    // ignore synthetic event errors
                }
            });
        }, 400); // 400ms long-press threshold
    };

    const cancelPress = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const endPress = () => {
        cancelPress();
        // if drag wasn't enabled, nothing to do; if it was enabled, keep enabled until drag stops
    };

    // use persisted gridLayout (ReactGridLayout expects an array)
    const layout = gridLayout;

    return (
        <div id='HomePage'>
            <div
                className='container'
                ref={containerRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Drop overlay for snippets */}
                <div
                    className={`drop-overlay ${isDropActive ? 'active' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                />
                <ReactGridLayout
                    key={`${cols}-${Math.floor(containerWidth)}`}
                    className='layout'
                    layout={layout}
                    cols={cols}
                    rowHeight={Math.max(120, Math.floor(containerWidth / cols))}
                    width={Math.max(320, Math.floor(containerWidth))}
                    isDraggable={dragEnabled}
                    isResizable={false}
                    margin={[16, 16]}
                    onDragStop={(newLayout) => {
                        // ignore drag drop if last pointer wasn't left-button
                        if (lastPointerButton.current && lastPointerButton.current !== 0) {
                            setDragEnabled(false);
                            setLongPressedId(null);
                            lastPointerButton.current = 0;
                            return;
                        }
                        // persist layout returned by RGL so moved positions are kept
                        if (Array.isArray(newLayout))
                            setGridLayout(newLayout.map((it) => ({ ...it })));
                        setDragEnabled(false);
                        setLongPressedId(null);
                        lastPointerButton.current = 0;
                    }}
                >
                    {visiblePosts.map((post) => (
                        <div
                            key={String(post.postId)}
                            className='post-card'
                            onPointerDown={(e) => {
                                // ignore non-left mouse buttons for pointer events
                                if (e.pointerType === 'mouse' && e.button !== 0) {
                                    console.log(
                                        'pointerdown ignored (non-left)',
                                        post.postId,
                                        e.button
                                    );
                                    return;
                                }
                                console.log('pointerdown', post.postId, e.pointerType);
                                startPress(post.postId, e.currentTarget, {
                                    x: e.clientX,
                                    y: e.clientY,
                                });
                            }}
                            onPointerUp={(e) => {
                                console.log('pointerup', post.postId, e.pointerType);
                                endPress();
                            }}
                            onPointerCancel={() => {
                                console.log('pointercancel', post.postId);
                                cancelPress();
                            }}
                            onMouseDown={(e) => {
                                // only start press for left button (0). ignore right-click (2) or middle (1).
                                if (e.button !== 0) return;
                                console.log('mousedown', post.postId);
                                startPress(post.postId, e.currentTarget, {
                                    x: e.clientX,
                                    y: e.clientY,
                                });
                            }}
                            onContextMenu={(e) => {
                                // prevent context menu while in drag mode for smoother UX
                                if (dragEnabled && String(longPressedId) === String(post.postId)) {
                                    e.preventDefault();
                                }
                            }}
                            onMouseUp={() => endPress()}
                            onMouseLeave={() => cancelPress()}
                            onTouchStart={(e) => {
                                console.log('touchstart', post.postId);
                                const t = e.touches && e.touches[0];
                                startPress(
                                    post.postId,
                                    e.currentTarget,
                                    t ? { x: t.clientX, y: t.clientY } : undefined
                                );
                            }}
                            onTouchEnd={() => endPress()}
                        >
                            <Link
                                to={`/post/${post.postId}`}
                                className='card-link'
                                onClick={(e) => {
                                    // prevent navigation if long-press enabled (user intends to drag)
                                    if (
                                        dragEnabled &&
                                        String(longPressedId) === String(post.postId)
                                    ) {
                                        e.preventDefault();
                                    }
                                }}
                            >
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
                            </Link>
                        </div>
                    ))}
                    {droppedSnippets.map((snip) => (
                        <div
                            key={snip.id}
                            className='dropped-snippet'
                            onPointerDown={(e) => {
                                // enable long-press drag for snippets as well
                                if (e.pointerType === 'mouse' && e.button !== 0) return;
                                startPress(snip.id, e.currentTarget, {
                                    x: e.clientX,
                                    y: e.clientY,
                                });
                            }}
                            onPointerUp={() => endPress()}
                            onPointerCancel={() => cancelPress()}
                            onMouseDown={(e) => {
                                if (e.button !== 0) return;
                                startPress(snip.id, e.currentTarget, {
                                    x: e.clientX,
                                    y: e.clientY,
                                });
                            }}
                            onMouseUp={() => endPress()}
                            onMouseLeave={() => cancelPress()}
                            onTouchStart={(e) => {
                                const t = e.touches && e.touches[0];
                                startPress(
                                    snip.id,
                                    e.currentTarget,
                                    t ? { x: t.clientX, y: t.clientY } : undefined
                                );
                            }}
                            onTouchEnd={() => endPress()}
                        >
                            <div className='dropped-header'>
                                <strong>{snip.type}</strong>
                                <div className='header-controls'>
                                    <button className='drag-handle' title='Drag'></button>
                                    <button onClick={() => removeDropped(snip.id)}>삭제</button>
                                </div>
                            </div>
                            <div className='dropped-body'>
                                {snip.type === 'swiper' && (
                                    <SimpleSwiper width={260} height={160} />
                                )}
                                {snip.type !== 'swiper' && (
                                    <div className='snippet-placeholder'>{snip.type}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </ReactGridLayout>
                <div ref={loadMoreRef} style={{ height: 1 }} />
            </div>
            {/* Side Panel */}
            <div className={`side-panel ${isPanelOpen ? 'open' : ''}`}>
                <div
                    className='panel-handle'
                    onMouseEnter={() => {
                        /* hover 효과: 너비가 살짝 나옴 */
                    }}
                    onClick={() => setIsPanelOpen((s) => !s)}
                >
                    <span>{isPanelOpen ? '▶' : '◀'}</span>
                </div>
                <div className='panel-content' aria-hidden={!isPanelOpen}>
                    <div className='snippet-palette'>
                        <div
                            className='snippet-item'
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'swiper')}
                        >
                            .swiper (Swiper container)
                        </div>
                        <div
                            className='snippet-item'
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'pagination')}
                        >
                            .swiper-pagination
                        </div>
                        <div
                            className='snippet-item'
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'navigation')}
                        >
                            .swiper-button-prev / .swiper-button-next
                        </div>
                        <div
                            className='snippet-item'
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'scrollbar')}
                        >
                            .swiper-scrollbar
                        </div>
                    </div>
                    <SwiperFeatureControls
                        value={null}
                        onChange={(cfg) => {
                            // 예: 현재 설정을 콘솔에 찍음. 실제로는 Swiper 인스턴스에 전달.
                            console.log('swiper cfg', cfg);
                        }}
                    />
                </div>
            </div>

            {isLogin && <Common.FloatingButton />}
        </div>
    );
};

export default HomePage;
