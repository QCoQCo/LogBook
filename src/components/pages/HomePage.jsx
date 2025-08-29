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
    // when true, skip the automatic layout rebuild effect once to avoid races
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
        // operate on a shallow copy
        const layout = arr.map((it) => ({ ...it }));
        const maxIter = 2000;
        let iter = 0;

        // helper to find item by id
        const findById = (id) => layout.find((it) => String(it.i) === String(id));

        // if target is not provided, nothing to anchor
        if (!target || target.i === undefined || target.i === null) return layout;

        const targetId = String(target.i);

        // ensure target exists in layout (if not, add it)
        let root = findById(targetId);
        if (!root) {
            layout.push({ ...target });
            root = findById(targetId);
        } else {
            // avoid clobbering layout's existing (possibly up-to-date) values
            // only overwrite when target explicitly provides numeric values
            if (typeof target.x === 'number') root.x = target.x;
            if (typeof target.y === 'number') root.y = target.y;
            if (typeof target.w === 'number') root.w = target.w;
            if (typeof target.h === 'number') root.h = target.h;
        }

        // BFS-like push: start from the anchored target and push any colliders down
        const queue = [root.i];
        while (queue.length && iter++ < maxIter) {
            const currentId = queue.shift();
            const current = findById(currentId);
            if (!current) continue;

            // find colliding items (excluding current itself)
            const collisions = layout.filter(
                (it) => String(it.i) !== String(current.i) && collides(current, it)
            );

            for (const col of collisions) {
                // never move the anchored target itself
                if (String(col.i) === targetId) continue;

                const prevY = Number(col.y || 0);
                const desiredY = Number(current.y || 0) + Number(current.h || 1);
                if (prevY < desiredY) {
                    col.y = desiredY;
                    // re-check this moved item for further collisions
                    queue.push(col.i);
                }
            }
        }

        // sort by spatial order for predictability
        layout.sort((a, b) => (a.y || 0) - (b.y || 0) || (a.x || 0) - (b.x || 0));
        return layout;
    };

    // Rebuild posts to fill empty cells while preserving snippet anchors.
    const rebuildPostsIntoGrid = (currentLayout) => {
        const current = Array.isArray(currentLayout)
            ? currentLayout
            : Array.isArray(gridLayoutRef.current)
            ? gridLayoutRef.current
            : [];
        try {
            console.info(
                'rebuildPostsIntoGrid called, current.length=',
                current.length,
                'visiblePosts.length=',
                (visiblePosts || []).length,
                'cols=',
                cols
            );
            console.info('rebuildPostsIntoGrid current sample:', current.slice(0, 6));
        } catch (err) {}

        // preserve existing post placements from current layout
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

        // snippet anchors
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
        // mark snippet-occupied cells
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

        // mark existing post positions as occupied and seed postEntries
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
        // place remaining posts that don't have preserved positions
        let placedCount = postEntries.length;
        let row = 0;
        let idx = 0;
        while (placedCount < postsArr.length) {
            for (let col = 0; col < cols && placedCount < postsArr.length; col++) {
                const key = `${col}:${row}`;
                if (!occupied.has(key)) {
                    // skip posts already preserved
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
            console.info(
                'rebuildPostsIntoGrid result.len=',
                final.length,
                'snippetEntries.len=',
                snippetEntries.length,
                'postEntries.len=',
                postEntries.length
            );
            console.info('rebuildPostsIntoGrid final sample:', final.slice(0, 8));
        } catch (err) {}
        return final;
    };

    // Development helper: compare a computed layout with the actual DOM nodes
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

            console.info('compareLayoutToDom', note, 'mapped sample:', mapped.slice(0, 8));
            console.info('compareLayoutToDom dom sample:', domItems.slice(0, 8));

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
            console.info(
                'compareLayoutToDom diffs.count=',
                diffs.length,
                'sample:',
                diffs.slice(0, 8)
            );
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
    // force remount key for ReactGridLayout so we can force UI to reflect our state when needed
    const [rglKey, setRglKey] = useState(
        () => `${cols}-${Math.floor(containerWidth)}-${Date.now()}`
    );
    // ref mirror so we can read latest layout synchronously inside event handlers
    const gridLayoutRef = useRef(gridLayout);
    useEffect(() => {
        gridLayoutRef.current = gridLayout;
    }, [gridLayout]);

    // expose ref for debugging in the browser console
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
                    // keep __rgl_last but remove debug helpers when unmounting
                    delete window.__gridLayout;
                    delete window.__compareLayoutToDom;
                }
            } catch (err) {}
        };
    }, []);

    // track which item is currently being resized (if any)
    const [resizingId, setResizingId] = useState(null);

    // infinite scroll: observe loadMoreRef and increase visibleCount when it enters viewport
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
        const type = e.dataTransfer.getData(SNIPPET_MIME) || '';
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
            w: Math.min(2, cols),
            h: 1,
            static: false,
        };

        // placeholder slides
        const slides = [1, 2, 3].map((n) => ({
            id: `${id}-s${n}`,
            title: `Slide ${n}`,
            src: `https://picsum.photos/seed/${id}-${n}/320/180`,
        }));

        // Add snippet record first to keep state coherent
        setDroppedSnippets((s) => [...s, { id, type, cfg: {}, slides }]);
        setIsDropActive(false);

        // Small delay to let droppedSnippets update and any effects run; then ensure layout contains the new snippet
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

    const removeDropped = (id) => {
        // remove snippet record
        setDroppedSnippets((s) => s.filter((it) => it.id !== id));
        // remove from layout then rebuild posts so freed cells are filled
        setGridLayout((prev) => (prev || []).filter((it) => String(it.i) !== String(id)));
        // schedule a rebuild so posts are compacted into freed space
        setTimeout(() => {
            try {
                const snapshot = Array.isArray(gridLayoutRef.current)
                    ? gridLayoutRef.current.slice()
                    : [];
                const filled = rebuildPostsIntoGrid(snapshot);
                setGridLayout(filled);
                setRglKey(`${cols}-${Math.floor(containerWidth)}-${Date.now()}`);
            } catch (err) {}
        }, 0);
    };

    // ensure layout: preserve dropped snippet entries, but rebuild post entries whenever
    // visible posts, column count, dropped snippets or the grid layout (positions/sizes)
    // change. We compare computed layout with current to avoid update loops.
    // 기존 useEffect 부분을 아래의 수정된 코드로 완전히 교체해주세요.

    useEffect(() => {
        // 드래그 중에는 자동 재배치를 건너뜁니다.
        if (forceMoveRef.current) {
            console.info('Skipping layout rebuild while dragging (forceMove-Ref)');
            return;
        }

        const current = Array.isArray(gridLayoutRef.current) ? gridLayoutRef.current : [];

        // 1. 스니펫(Swiper)들의 위치는 현재 상태 그대로 유지합니다. (핵심 보존 대상)
        const snippetEntries = current
            .filter((it) => String(it.i).startsWith('snippet-'))
            .map((it) => ({
                ...it,
                x: Math.max(0, Math.min(cols - 1, Number(it.x || 0))),
                y: Math.max(0, Number(it.y || 0)), // 괄호 수정
                w: Math.max(1, Math.min(cols, Number(it.w || 1))),
                h: Math.max(1, Number(it.h || 1)), // 괄호 수정
            }));

        // 2. 스니펫들이 차지하는 공간을 미리 계산합니다.
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

        // 💡 **가장 중요한 변경 지점**
        // 기존 포스트의 위치를 보존하던 로직(existingPostMap)을 모두 제거합니다.
        // 대신, 모든 포스트를 처음부터 빈 공간에 순서대로 배치합니다.
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

        // 3. 유지된 스니펫과 새로 배치된 포스트들을 합쳐 최종 레이아웃을 만듭니다.
        const next = [...snippetEntries, ...postEntries];
        next.sort((a, b) => (a.y || 0) - (b.y || 0) || (a.x || 0) - (b.x || 0));
        const mapped = next.map((it) => ({
            ...it,
            static: String(it.i).startsWith('snippet-') ? false : true,
        }));

        // 4. 실제 변경이 있을 때만 상태를 업데이트하여 무한 루프를 방지합니다.
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
            setGridLayout(mapped);
        }
    }, [visibleCount, cols, droppedSnippets.length, gridLayout]);

    // pointer refs used by long-press synthetic dispatch
    const lastPointer = useRef({ x: 0, y: 0 });
    const lastPointerButton = useRef(0);
    // snapshot of the item's prior layout at the moment resize starts
    const resizingPriorRef = useRef(null);
    // when true, temporarily allow posts to be moved so snippets can push them
    const forceMoveRef = useRef(false);
    // rAF ref to throttle live resize updates
    const resizeRaf = useRef(null);

    // ensure we cancel any scheduled rAF on unmount
    useEffect(() => {
        return () => {
            if (resizeRaf.current) cancelAnimationFrame(resizeRaf.current);
        };
    }, []);

    const startPress = (id, target, pos) => {
        // reset any existing timer
        if (pressTimer.current) clearTimeout(pressTimer.current);
        pressTimer.current = setTimeout(() => {
            setDragEnabled(true);
            setLongPressedId(id);
            // Wait one frame so React/ReactGridLayout sees isDraggable change
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
                    key={rglKey}
                    className='layout'
                    layout={layout}
                    cols={cols}
                    rowHeight={Math.max(120, Math.floor(containerWidth / cols))}
                    // enable dragging globally; individual items remain static if their layout has static: true
                    isDraggable={true}
                    isResizable={true}
                    compactType={null}
                    margin={[MARGIN_X, MARGIN_Y]}
                    onResizeStop={(newLayout, oldItem, newItem) => {
                        if (!Array.isArray(newLayout)) return;

                        // Normalize incoming layout
                        const normalized = newLayout.map((it) => ({
                            i: String(it.i),
                            x: Number(it.x || 0),
                            y: Number(it.y || 0),
                            w: Number(it.w || 1),
                            h: Number(it.h || 1),
                            static: String(it.i).startsWith('snippet-') ? false : true,
                        }));

                        const rawTarget = newItem || oldItem || {};
                        const id = String(rawTarget.i || '');
                        const prior =
                            resizingPriorRef.current ||
                            (gridLayoutRef.current || []).find((it) => String(it.i) === id) ||
                            null;

                        const priorX = prior ? Number(prior.x || 0) : Number(rawTarget.x || 0);
                        const priorY = prior ? Number(prior.y || 0) : Number(rawTarget.y || 0);
                        const newW =
                            typeof rawTarget.w === 'number'
                                ? Number(rawTarget.w)
                                : prior
                                ? Number(prior.w || 1)
                                : 1;
                        const newH =
                            typeof rawTarget.h === 'number'
                                ? Number(rawTarget.h)
                                : prior
                                ? Number(prior.h || 1)
                                : 1;

                        const mergedTarget = { i: id, x: priorX, y: priorY, w: newW, h: newH };

                        const normalizedAnchored = normalized.map((it) =>
                            String(it.i) === id
                                ? { ...it, x: mergedTarget.x, y: mergedTarget.y, w: newW, h: newH }
                                : it
                        );

                        // Resolve collisions, which will push items down if needed
                        const resolved = resolveCollisions(normalizedAnchored, mergedTarget);
                        const mapped = resolved.map((it) => ({
                            ...it,
                            i: String(it.i),
                            static: String(it.i).startsWith('snippet-') ? false : true,
                        }));

                        // 💡 **수정된 부분:**
                        // rebuildPostsIntoGrid 로직을 모두 제거하고, 충돌 해결 결과만 상태에 반영합니다.
                        // useEffect가 이 변경을 감지하고 전체 재배치를 처리할 것입니다.
                        setGridLayout(mapped);

                        // setRglKey를 호출하여 UI 동기화를 확실히 할 수 있습니다.
                        setRglKey(`${cols}-${Math.floor(containerWidth)}-${Date.now()}`);

                        setResizingId(null);
                        resizingPriorRef.current = null;
                    }}
                    onResizeStart={(layout, oldItem, newItem, placeholder, e) => {
                        try {
                            const id = String(
                                (newItem && newItem.i) || (oldItem && oldItem.i) || ''
                            );
                            setResizingId(id);
                            try {
                                const prior = (gridLayoutRef.current || []).find(
                                    (it) => String(it.i) === String(id)
                                );
                                resizingPriorRef.current = prior ? { ...prior } : null;
                            } catch (err) {
                                resizingPriorRef.current = null;
                            }
                            window.__rgl_last = {
                                phase: 'onResizeStart',
                                id,
                                layout: Array.isArray(layout)
                                    ? layout.map((it) => ({
                                          i: String(it.i),
                                          x: Number(it.x || 0),
                                          y: Number(it.y || 0),
                                          w: Number(it.w || 1),
                                          h: Number(it.h || 1),
                                      }))
                                    : null,
                                rawOld: oldItem || null,
                                rawNew: newItem || null,
                            };
                            console.info('onResizeStart:', id);
                        } catch (e) {}
                    }}
                    onResize={(layout, oldItem, newItem) => {
                        // onResize is too noisy to resolve collisions properly.
                        // Instead, we just update the layout with the new size,
                        // and defer collision resolution to onResizeStop.
                        const id = String(newItem.i || oldItem.i || '');
                        if (!id) return;
                        setGridLayout((prev) =>
                            (prev || []).map((it) =>
                                String(it.i) === id
                                    ? {
                                          ...it,
                                          w: newItem.w,
                                          h: newItem.h,
                                      }
                                    : it
                            )
                        );
                    }}
                    onDragStart={(layout, oldItem, newItem, placeholder, e) => {
                        try {
                            const id = String(
                                (newItem && newItem.i) || (oldItem && oldItem.i) || ''
                            );
                            setDragEnabled(true);
                            setLongPressedId(id);
                            // temporarily allow posts to be moved so the dragged snippet can
                            // occupy the requested cell and push posts out of the way
                            try {
                                forceMoveRef.current = true;
                                setGridLayout((prev) =>
                                    (prev || []).map((it) => ({
                                        ...it,
                                        // snippets remain non-static; posts temporarily become non-static
                                        static: String(it.i).startsWith('snippet-') ? false : false,
                                    }))
                                );
                            } catch (err) {}
                            window.__rgl_last = {
                                phase: 'onDragStart',
                                id,
                                layout: Array.isArray(layout)
                                    ? layout.map((it) => ({
                                          i: String(it.i),
                                          x: Number(it.x || 0),
                                          y: Number(it.y || 0),
                                          w: Number(it.w || 1),
                                          h: Number(it.h || 1),
                                      }))
                                    : null,
                                rawOld: oldItem || null,
                                rawNew: newItem || null,
                            };
                        } catch (e) {}
                    }}
                    onDragStop={(newLayout, oldItem, newItem) => {
                        try {
                            window.__rgl_last = {
                                phase: 'onDragStop',
                                id: String((newItem && newItem.i) || (oldItem && oldItem.i) || ''),
                                layout: Array.isArray(newLayout)
                                    ? newLayout.map((it) => ({
                                          i: String(it.i),
                                          x: Number(it.x || 0),
                                          y: Number(it.y || 0),
                                          w: Number(it.w || 1),
                                          h: Number(it.h || 1),
                                      }))
                                    : null,
                                rawOld: oldItem || null,
                                rawNew: newItem || null,
                            };
                            console.info('onDragStop:', window.__rgl_last.id);
                        } catch (e) {}

                        if (!Array.isArray(newLayout)) return;

                        // Build authoritative base from last committed layout (gridLayoutRef)
                        // so we move existing posts instead of recreating them from scratch.
                        const base = (
                            Array.isArray(gridLayoutRef.current) ? gridLayoutRef.current : []
                        ).map((it) => ({
                            i: String(it.i),
                            x: Number(it.x || 0),
                            y: Number(it.y || 0),
                            w: Number(it.w || 1),
                            h: Number(it.h || 1),
                            static: String(it.i).startsWith('snippet-')
                                ? false
                                : Boolean(it.static),
                        }));

                        const rawRequested =
                            (window && window.__rgl_last && window.__rgl_last.rawNew) || null;
                        const desiredTarget =
                            rawRequested && rawRequested.i
                                ? {
                                      i: String(rawRequested.i),
                                      x: Number.isFinite(Number(rawRequested.x))
                                          ? Number(rawRequested.x)
                                          : Number((newItem && newItem.x) || 0),
                                      y: Number.isFinite(Number(rawRequested.y))
                                          ? Number(rawRequested.y)
                                          : Number((newItem && newItem.y) || 0),
                                      w: Number.isFinite(Number(rawRequested.w))
                                          ? Number(rawRequested.w)
                                          : Number((newItem && newItem.w) || 1),
                                      h: Number.isFinite(Number(rawRequested.h))
                                          ? Number(rawRequested.h)
                                          : Number((newItem && newItem.h) || 1),
                                  }
                                : newItem
                                ? {
                                      i: String(newItem.i),
                                      x: Number(newItem.x || 0),
                                      y: Number(newItem.y || 0),
                                      w: Number(newItem.w || 1),
                                      h: Number(newItem.h || 1),
                                  }
                                : null;

                        // Apply desired target onto the base layout (or append if missing)
                        let found = false;
                        const baseWithTarget = base.map((it) => {
                            if (String(it.i) === String(desiredTarget?.i)) {
                                found = true;
                                return {
                                    ...it,
                                    x: desiredTarget.x,
                                    y: desiredTarget.y,
                                    w: desiredTarget.w,
                                    h: desiredTarget.h,
                                    static: false,
                                };
                            }
                            return { ...it };
                        });
                        if (!found && desiredTarget) {
                            baseWithTarget.push({
                                i: String(desiredTarget.i),
                                x: desiredTarget.x,
                                y: desiredTarget.y,
                                w: desiredTarget.w,
                                h: desiredTarget.h,
                                static: false,
                            });
                        }

                        const resolved = resolveCollisions(baseWithTarget, desiredTarget);
                        const mapped = resolved.map((it) => ({
                            ...it,
                            i: String(it.i),
                            static: String(it.i).startsWith('snippet-') ? false : true,
                        }));

                        // Debug logs: record incoming, desired and resolved layouts
                        try {
                            console.info('onDragStop incoming newLayout:', newLayout);
                            console.info(
                                'onDragStop rawNew:',
                                (window && window.__rgl_last && window.__rgl_last.rawNew) || null
                            );
                            console.info('onDragStop desiredTarget:', desiredTarget);
                            console.info('onDragStop resolved mapped (pre-set):', mapped);
                        } catch (err) {}

                        skipRebuildRef.current = true;
                        setGridLayout(mapped);
                        // Force a remount to ensure the DOM matches the resolved state
                        setRglKey(`${cols}-${Math.floor(containerWidth)}-${Date.now()}`);

                        // debug: compare mapped vs DOM after a tick
                        setTimeout(
                            () => compareLayoutToDom(mapped, 'onDragStop after remount'),
                            50
                        );

                        // setState is async; log the ref a tick later to confirm what was actually written
                        setTimeout(() => {
                            try {
                                console.info(
                                    'gridLayoutRef.current (after setGridLayout):',
                                    gridLayoutRef.current
                                );
                            } catch (err) {}
                        }, 0);

                        // restore posts to static if we temporarily allowed movement
                        try {
                            if (forceMoveRef.current) {
                                // Immediately compact/fill freed cells so UI reflects final state
                                try {
                                    const filled = rebuildPostsIntoGrid();
                                    setGridLayout(filled);
                                    setRglKey(
                                        `${cols}-${Math.floor(containerWidth)}-${Date.now()}`
                                    );
                                } catch (err) {}
                                // clear the forced-move flag so future rebuilds run normally
                                forceMoveRef.current = false;
                            }
                        } catch (err) {}

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
                                    &nbsp;&nbsp;&nbsp;
                                    <button
                                        type='button'
                                        onPointerDown={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            removeDropped(snip.id);
                                        }}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                        }}
                                        onTouchStart={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            removeDropped(snip.id);
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            removeDropped(snip.id);
                                        }}
                                    >
                                        삭제
                                    </button>
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
