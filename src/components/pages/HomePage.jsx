import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/LogBookContext';
import * as Common from '../common';
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

    // ensure layout has entries for newly visible posts (append only)
    useEffect(() => {
        if (!visiblePosts || visiblePosts.length === 0) return;
        setGridLayout((prev) => {
            const next = [...prev];
            for (let i = prev.length; i < visiblePosts.length; i++) {
                const p = visiblePosts[i];
                next.push({
                    i: String(p.postId || i),
                    x: i % cols,
                    y: Math.floor(i / cols),
                    w: 1,
                    h: 1,
                });
            }
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
        pressTimer.current = setTimeout(() => {
            setDragEnabled(true);
            setLongPressedId(id);
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
            <div className='container' ref={containerRef}>
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
                                    return;
                                }
                                startPress(post.postId, e.currentTarget, {
                                    x: e.clientX,
                                    y: e.clientY,
                                });
                            }}
                            onPointerUp={(e) => {
                                endPress();
                            }}
                            onPointerCancel={() => {
                                cancelPress();
                            }}
                            onMouseDown={(e) => {
                                // only start press for left button (0). ignore right-click (2) or middle (1).
                                if (e.button !== 0) return;
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
                </ReactGridLayout>
                {/* sentinel for loading more */}
                <div ref={loadMoreRef} style={{ height: 1 }} />
            </div>
            {isLogin && <Common.FloatingButton />}
        </div>
    );
};

export default HomePage;
