import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/LogBookContext';
import * as Common from '../common';
import LogBookSwiper from '../common/Swiper';
import RGL, { WidthProvider } from 'react-grid-layout';
const ReactGridLayout = WidthProvider(RGL);
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

    // container / responsive grid helpers
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(1200);
    const [cols, setCols] = useState(4);
    // grid margins (keep in sync with ReactGridLayout margin prop)
    const MARGIN_X = 16;
    const MARGIN_Y = 16;

    const computeCols = (w) => {
        if (w >= 1100) return 4;
        if (w >= 800) return 3;
        if (w >= 500) return 2;
        return 1;
    };

    // --- collision helpers ---
    const collides = (a, b) => {
        return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    };

    // resolve collisions by pushing colliding items downwards; mutates arrCopy
    const resolveCollisions = (arr, target) => {
        // work on a shallow copy
        const layout = arr.map((it) => ({ ...it }));
        const maxIter = 2000;
        let iter = 0;

        // helper to find item by id
        const findById = (id) => layout.find((it) => String(it.i) === String(id));

        // ensure target exists in layout (if not, add temporarily)
        let root = findById(target.i);
        if (!root) {
            layout.push({ ...target });
            root = findById(target.i);
            root.y = target.y;
            root.w = target.w;
            root.h = target.h;
        }

        const toCheck = [root.i];
        while (toCheck.length && iter++ < maxIter) {
            const currentId = toCheck.shift();
            const current = findById(currentId);
            if (!current) continue;
            // find colliding items (excluding current itself)
            const collisions = layout.filter(
                (it) => String(it.i) !== String(current.i) && collides(current, it)
            );
            collisions.forEach((col) => {
                const prevY = col.y || 0;
                // push the collided item below current
                col.y = (current.y || 0) + (current.h || 1);
                // if we moved it, ensure it's rechecked for further collisions
                if (col.y !== prevY) toCheck.push(col.i);
            });
        }

        return layout;
    };

    useLayoutEffect(() => {
        const el = containerRef.current;
        const update = () => {
            const w = el?.clientWidth || window.innerWidth;

            setContainerWidth(w);
            setCols((prev) => {
                const c = computeCols(w);
                return c !== prev ? c : prev;
            });
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const visiblePosts = posts.slice(0, visibleCount);
    // persisted layout so user moves are kept
    const [gridLayout, setGridLayout] = useState([]);

    // side panel / snippets state
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [droppedSnippets, setDroppedSnippets] = useState([]);
    const [isDropActive, setIsDropActive] = useState(false);
    const SNIPPET_MIME = 'application/x-logbook-snippet';

    const SWIPER_MODULES = [
        { id: 'default', label: 'Default' },
        { id: 'navigation', label: 'Navigation' },
        { id: 'pagination', label: 'Pagination' },
        { id: 'pagination-dynamic', label: 'Pagination (dynamic)' },
        { id: 'pagination-progress', label: 'Pagination (progress)' },
        { id: 'pagination-fraction', label: 'Pagination (fraction)' },
        { id: 'pagination-custom', label: 'Pagination (custom)' },
        { id: 'scrollbar', label: 'Scrollbar' },
        { id: 'vertical', label: 'Vertical' },
        { id: 'space-between', label: 'Space between' },
        { id: 'slides-per-view', label: 'Slides per view' },
        { id: 'slides-per-view-auto', label: 'Slides per view (auto)' },
        { id: 'centered', label: 'Centered' },
        { id: 'centered-auto', label: 'Centered auto' },
        { id: 'css-mode', label: 'CSS mode' },
        { id: 'freemode', label: 'FreeMode' },
        { id: 'scroll-container', label: 'Scroll container' },
        { id: 'grid', label: 'Grid' },
        { id: 'nested', label: 'Nested' },
        { id: 'grab-cursor', label: 'Grab cursor' },
        { id: 'infinite-loop', label: 'Infinite loop' },
        { id: 'slides-per-group-skip', label: 'Slides per group skip' },
        { id: 'effect-fade', label: 'Effect: Fade' },
        { id: 'effect-cube', label: 'Effect: Cube' },
        { id: 'effect-coverflow', label: 'Effect: Coverflow' },
        { id: 'effect-flip', label: 'Effect: Flip' },
        { id: 'effect-cards', label: 'Effect: Cards' },
        { id: 'effect-creative', label: 'Effect: Creative' },
        { id: 'keyboard', label: 'Keyboard control' },
        { id: 'mousewheel', label: 'Mousewheel control' },
        { id: 'autoplay', label: 'Autoplay' },
        { id: 'autoplay-progress', label: 'Autoplay (progress)' },
        { id: 'manipulation', label: 'Manipulation' },
        { id: 'thumbs-gallery', label: 'Thumbs gallery' },
        { id: 'thumbs-gallery-loop', label: 'Thumbs gallery (loop)' },
        { id: 'multiple-swipers', label: 'Multiple swipers' },
        { id: 'hash-navigation', label: 'Hash navigation' },
        { id: 'history', label: 'History' },
        { id: 'rtl', label: 'RTL' },
        { id: 'parallax', label: 'Parallax' },
        { id: 'lazy-load', label: 'Lazy load images' },
        { id: 'responsive-breakpoints', label: 'Responsive breakpoints' },
        { id: 'ratio-breakpoints', label: 'Ratio breakpoints' },
        { id: 'autoheight', label: 'Autoheight' },
        { id: 'zoom', label: 'Zoom' },
        { id: 'virtual-slides', label: 'Virtual slides' },
        { id: 'watch-slides-visibility', label: 'Watch slides visibility' },
        { id: 'rewind', label: 'Rewind' },
    ];

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
            // compute grid row from drop y so snippets are placed where dropped
            const gy = Math.min(Math.max(0, Math.floor(y / (rowH + MARGIN_Y))), 1000);

            const id = `snippet-${Date.now()}`;
            const layoutItem = { i: id, x: gx, y: gy, w: 1, h: 1, static: false };

            const cfg = {
                showNav: false,
                showPagination: false,
                showScrollbar: false,
                autoplay: false,
                autoplayDelay: 2500,
                slidesPerView: 1,
                spaceBetween: 0,
                loop: false,
                keyboard: false,
                mousewheel: false,
                freeMode: false,
                grabCursor: false,
                slidesPerGroup: 1,
                effect: 'slide',
            };
            if (type === 'default') {
                cfg.showNav = false;
                cfg.showPagination = false;
            } else if (type === 'swiper') {
                cfg.showNav = true;
                cfg.showPagination = true;
            } else if (type === 'pagination') {
                cfg.showPagination = true;
            } else if (type === 'navigation') {
                cfg.showNav = true;
            } else if (type === 'slides-per-view') {
                cfg.slidesPerView = 3;
                cfg.spaceBetween = 12;
            } else if (type === 'slides-per-view-auto') {
                cfg.slidesPerView = 'auto';
                cfg.spaceBetween = 8;
            } else if (type === 'space-between') {
                cfg.spaceBetween = 24;
            } else if (type === 'centered') {
                cfg.slidesPerView = 1.5;
                cfg.centered = true;
                cfg.grabCursor = true;
            } else if (type === 'centered-auto') {
                cfg.slidesPerView = 'auto';
                cfg.centered = true;
                cfg.grabCursor = true;
            } else if (type === 'css-mode') {
                cfg.cssMode = true;
            } else if (type === 'freemode') {
                cfg.freeMode = true;
            } else if (type === 'infinite-loop') {
                cfg.loop = true;
            } else if (type === 'keyboard') {
                cfg.keyboard = true;
            } else if (type === 'mousewheel') {
                cfg.mousewheel = true;
            } else if (type === 'effect-cube') {
                cfg.effect = 'cube';
            } else if (type === 'effect-cards') {
                cfg.effect = 'cards';
            } else if (type === 'effect-creative') {
                cfg.effect = 'creative';
            } else if (type === 'scrollbar') {
                cfg.showScrollbar = true;
            } else if (type === 'autoplay') {
                cfg.autoplay = true;
            } else if (type === 'super-flow') {
                cfg.effect = 'coverflow';
                cfg.showNav = true;
                cfg.showPagination = true;
            } else if (type === 'expo-slider') {
                cfg.effect = 'fade';
                cfg.autoplay = true;
                cfg.showPagination = true;
            } else if (type === 'card-stack') {
                cfg.effect = 'flip';
                cfg.showNav = true;
            } else if (type === 'material-you') {
                cfg.effect = 'coverflow';
                cfg.showNav = true;
            } else if (type === 'lazy') {
                // show lazy placeholder slides
            }

            // presets mapping for requested sliders
            else if (type === 'tinder-slider') {
                cfg.effect = 'flip';
                cfg.showNav = true;
            } else if (type === 'shaders-slider') {
                cfg.effect = 'coverflow';
                cfg.showPagination = true;
            } else if (type === 'slicer-slider') {
                cfg.effect = 'slide';
                cfg.showNav = true;
            } else if (type === 'shutters-slider') {
                cfg.effect = 'fade';
                cfg.showPagination = true;
            } else if (type === 'stories-slider') {
                cfg.effect = 'slide';
                cfg.autoplay = true;
                cfg.showPagination = true;
            } else if (type === 'spring-slider') {
                cfg.effect = 'coverflow';
                cfg.autoplay = true;
            } else if (type === 'panorama-slider') {
                cfg.effect = 'slide';
                cfg.showNav = true;
            } else if (type === 'fashion-slider') {
                cfg.effect = 'coverflow';
                cfg.showNav = true;
                cfg.showPagination = true;
            } else if (type === 'carousel-slider') {
                cfg.effect = 'slide';
                cfg.showNav = true;
                cfg.autoplay = true;
            } else if (type === 'triple-slider') {
                cfg.effect = 'slide';
                cfg.showNav = true;
            } else if (type === 'travel-slider') {
                cfg.effect = 'coverflow';
                cfg.autoplay = true;
            } else if (type === 'expanding-collection') {
                cfg.effect = 'fade';
                cfg.showPagination = true;
            } else if (type === 'posters-slider') {
                cfg.effect = 'coverflow';
                cfg.showNav = true;
            } else if (type === 'paper-onboarding') {
                cfg.effect = 'fade';
                cfg.autoplay = true;
            } else if (type === 'swiper-3d-slicer') {
                cfg.effect = 'coverflow';
                cfg.showNav = true;
                cfg.showPagination = true;
            } else if (type === 'swiper-3d-pagination') {
                cfg.effect = 'flip';
                cfg.showPagination = true;
            }

            // create placeholder slides so preview has content
            const slides = [1, 2, 3].map((n) => ({
                id: `${id}-s${n}`,
                title: `Slide ${n}`,
                src: `https://picsum.photos/seed/${id}-${n}/320/180`,
            }));

            setGridLayout((prev) => {
                const prevArr = Array.isArray(prev) ? prev : [];
                // insert the new snippet at the drop coords; preserve other items
                const next = [...prevArr.filter(Boolean), layoutItem];
                // resolve collisions so only overlapping items are pushed down
                const resolved = resolveCollisions(next, layoutItem);
                // sort so layout array reflects spatial order (helps visual predictability)
                resolved.sort((a, b) => (a.y || 0) - (b.y || 0) || (a.x || 0) - (b.x || 0));
                return resolved.map((it) => ({
                    ...it,
                    // ensure snippet items remain non-static so they are draggable/resizable
                    static: String(it.i).startsWith('snippet-') ? false : Boolean(it.static),
                }));
            });
            // enable dragging so user can immediately pick up the newly added item
            setDragEnabled(true);
            setDroppedSnippets((s) => [...s, { id, type, cfg, slides }]);
        }
        setIsDropActive(false);
    };

    const removeDropped = (id) => {
        setDroppedSnippets((s) => s.filter((it) => it.id !== id));
        setGridLayout((prev) => prev.filter((it) => String(it.i) !== String(id)));
    };

    // ensure layout: preserve dropped snippet entries, but rebuild post entries every time
    // Place posts into the first available grid cell (scan row-major) avoiding cells occupied by snippets
    useEffect(() => {
        setGridLayout((prev) => {
            const prevArr = Array.isArray(prev) ? prev : [];
            const snippetEntries = prevArr.filter((it) => String(it.i).startsWith('snippet-'));

            // build occupied cell set from snippet entries
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
            // scan rows until all posts are placed
            let placedCount = 0;
            let row = 0;
            while (placedCount < postsArr.length) {
                for (let col = 0; col < cols && placedCount < postsArr.length; col++) {
                    const key = `${col}:${row}`;
                    if (!occupied.has(key)) {
                        const p = postsArr[placedCount];
                        postEntries.push({
                            i: String(p.postId || placedCount),
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

            return [...snippetEntries, ...postEntries];
        });
    }, [visiblePosts.length, cols, droppedSnippets.length]);

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

            requestAnimationFrame(() => {
                try {
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
        }, 500); // 400ms long-press threshold
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
                    // enable dragging globally; individual items remain static if their layout has static: true
                    isDraggable={true}
                    isResizable={true}
                    margin={[MARGIN_X, MARGIN_Y]}
                    onLayoutChange={(newLayout) => {
                        if (Array.isArray(newLayout))
                            setGridLayout(
                                newLayout.map((it) => ({
                                    // keep posts static (ids that don't start with 'snippet-')
                                    ...it,
                                    static: String(it.i).startsWith('snippet-') ? false : true,
                                }))
                            );
                    }}
                    onResizeStop={(newLayout, oldItem, newItem) => {
                        if (Array.isArray(newLayout)) {
                            const target = newItem || oldItem;
                            const resolved = resolveCollisions(newLayout, target || {});
                            setGridLayout(
                                resolved.map((it) => ({
                                    ...it,
                                    static: String(it.i).startsWith('snippet-') ? false : true,
                                }))
                            );
                        }
                        setDragEnabled(false);
                        setLongPressedId(null);
                        lastPointerButton.current = 0;
                    }}
                    onDragStop={(newLayout, oldItem, newItem) => {
                        // ignore drag drop if last pointer wasn't left-button
                        if (lastPointerButton.current && lastPointerButton.current !== 0) {
                            setDragEnabled(false);
                            setLongPressedId(null);
                            lastPointerButton.current = 0;
                            return;
                        }
                        // persist layout returned by RGL so moved positions are kept
                        if (Array.isArray(newLayout)) {
                            const moved = newItem || oldItem || {};
                            const resolved = resolveCollisions(newLayout, moved);
                            setGridLayout(
                                resolved.map((it) => ({
                                    ...it,
                                    static: String(it.i).startsWith('snippet-') ? false : true,
                                }))
                            );
                        }
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
                                {/* render a Small preview for any snippet module */}
                                {(() => {
                                    // compute pixel size from layout w/h
                                    const layoutItem = (layout || []).find(
                                        (it) => String(it.i) === String(snip.id)
                                    );
                                    const colWidth =
                                        (containerWidth - MARGIN_X * (cols - 1)) / cols;
                                    const rowH = Math.max(120, Math.floor(containerWidth / cols));
                                    const widthPx = layoutItem
                                        ? Math.max(
                                              120,
                                              Math.floor(
                                                  layoutItem.w * colWidth +
                                                      (layoutItem.w - 1) * MARGIN_X
                                              )
                                          )
                                        : 260;
                                    const heightPx = layoutItem
                                        ? Math.max(
                                              80,
                                              Math.floor(
                                                  layoutItem.h * rowH +
                                                      (layoutItem.h - 1) * MARGIN_Y
                                              )
                                          )
                                        : 160;
                                    return (
                                        <LogBookSwiper
                                            width={widthPx}
                                            height={heightPx}
                                            slides={snip.slides}
                                            {...(snip.cfg || {})}
                                        />
                                    );
                                })()}
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
                        {SWIPER_MODULES.map((m) => (
                            <div
                                key={m.id}
                                className='snippet-item'
                                draggable
                                onDragStart={(e) => handleDragStart(e, m.id)}
                                title={m.label}
                            >
                                {m.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isLogin && <Common.FloatingButton />}
        </div>
    );
};

export default HomePage;
