import React, { useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
    Navigation,
    Pagination,
    Scrollbar,
    Autoplay,
    EffectFade,
    EffectCoverflow,
    EffectFlip,
    Keyboard,
    Mousewheel,
    FreeMode,
    EffectCube,
    EffectCards,
    EffectCreative,
    Virtual,
    Zoom,
    Grid,
} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';
import 'swiper/css/effect-fade';
import 'swiper/css/effect-coverflow';
import 'swiper/css/effect-flip';
import 'swiper/css/free-mode';
import 'swiper/css/effect-cube';
import 'swiper/css/effect-cards';
import 'swiper/css/effect-creative';
import 'swiper/css/virtual';
import 'swiper/css/zoom';
import './Swiper.scss';

export default function LogBookSwiper({
    slides = [],
    width = undefined,
    height = undefined,
    showNav = true,
    showPagination = true,
    showScrollbar = false,
    autoplay = false,
    autoplayDelay = 2500,
    effect = 'slide',
    slidesPerView = 1,
    spaceBetween = 0,
    loop = false,
    keyboard = false,
    mousewheel = false,
    freeMode = false,
    grabCursor = false,
    slidesPerGroup = 1,
    breakpoints = undefined,
    autoHeight = false,
    virtual = false,
    lazy = false,
    zoom = false,
    grid = undefined,
    // allow passing native Swiper props through the wrapper
    direction = 'horizontal',
    modules: modulesProp = [],
    // touch controls
    simulateTouch = false,
    allowTouchMove = true,
    className: swiperClassName = '',
}) {
    const items =
        slides && slides.length
            ? slides
            : [
                  { id: 1, title: 'Slide 1' },
                  { id: 2, title: 'Slide 2' },
                  { id: 3, title: 'Slide 3' },
              ];

    const modules = [];
    // Support boolean or object for these features so callers can pass option objects
    const hasNav = !!showNav;
    const hasPagination = !!showPagination;
    const hasScrollbar = !!showScrollbar;
    if (hasNav) modules.push(Navigation);
    if (hasPagination) modules.push(Pagination);
    if (hasScrollbar) modules.push(Scrollbar);
    if (autoplay) modules.push(Autoplay);
    if (keyboard) modules.push(Keyboard);
    if (mousewheel) modules.push(Mousewheel);
    if (freeMode) modules.push(FreeMode);
    if (virtual) modules.push(Virtual);
    if (zoom) modules.push(Zoom);
    if (grid) modules.push(Grid);
    // effect modules
    if (effect === 'fade') modules.push(EffectFade);
    if (effect === 'coverflow') modules.push(EffectCoverflow);
    if (effect === 'flip') modules.push(EffectFlip);
    if (effect === 'cube') modules.push(EffectCube);
    if (effect === 'cards') modules.push(EffectCards);
    if (effect === 'creative') modules.push(EffectCreative);

    // merge any externally provided Swiper modules (e.g. [Pagination])
    if (Array.isArray(modulesProp) && modulesProp.length) {
        modules.push(...modulesProp);
    }

    // Accept either boolean or option object for pagination/navigation/scrollbar.
    const paginationVal =
        typeof showPagination === 'object'
            ? showPagination
            : showPagination
            ? { clickable: true }
            : false;
    const navigationVal = typeof showNav === 'object' ? showNav : showNav ? true : false;
    const scrollbarVal =
        typeof showScrollbar === 'object'
            ? showScrollbar
            : showScrollbar
            ? { draggable: true }
            : false;

    const hasCustomRenderBullet = !!(
        paginationVal &&
        typeof paginationVal === 'object' &&
        typeof paginationVal.renderBullet === 'function'
    );

    // Use native Swiper pagination element by default (do not force custom el)
    const paginationForSwiper = paginationVal || false;

    // build final swiper props and allow passing direction + extra className
    let swiperClass =
        `swiper effect-${effect}` + (hasCustomRenderBullet ? ' pagination-custom' : '');
    if (swiperClassName) swiperClass += ` ${swiperClassName}`;

    const swiperProps = {
        modules,
        navigation: navigationVal,
        pagination: paginationForSwiper,
        scrollbar: scrollbarVal,
        autoplay: autoplay ? { delay: autoplayDelay, disableOnInteraction: false } : false,
        effect: effect === 'slide' ? 'slide' : effect,
        className: swiperClass,
        direction,
        slidesPerView,
        spaceBetween,
        loop,
        keyboard: keyboard ? { enabled: true } : false,
        mousewheel: mousewheel ? { forceToAxis: true } : false,
        freeMode: freeMode ? { enabled: true } : false,
        grabCursor: !!grabCursor,
        slidesPerGroup,
        breakpoints: breakpoints || undefined,
        autoHeight: !!autoHeight,
        virtual: virtual ? { enabled: true } : false,
        zoom: zoom ? { maxRatio: 2 } : false,
        grid: grid || undefined,
        simulateTouch: !!simulateTouch,
        allowTouchMove: !!allowTouchMove,
        observer: true,
        observeParents: true,
    };
    const containerRef = useRef(null);
    const swiperRef = useRef(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            try {
                swiperRef.current &&
                    typeof swiperRef.current.update === 'function' &&
                    swiperRef.current.update();
            } catch (err) {
                // ignore observer errors
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Dynamically compute bullet size from pagination width / item count (preference),
    // fallback to width/height-based estimates. Set CSS var --sw-bullet-size on the wrapper.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const updateBullet = () => {
            try {
                // prefer the Swiper-generated pagination element inside the Swiper root
                const pag =
                    el.querySelector('.swiper .swiper-pagination') ||
                    el.querySelector('.swiper-pagination');
                let size = undefined;
                const count = (items && items.length) || 1;
                if (pag) {
                    const pw = pag.clientWidth || el.clientWidth || 0;
                    // estimate a reasonable bullet size from available pagination width
                    // reserve some space for gaps; avoid too small/large values
                    const base = pw / Math.max(count, 6);
                    size = Math.max(10, Math.min(32, Math.round(base * 0.8)));
                    // debug: log pagination element and sizes
                    try {
                        // eslint-disable-next-line no-console
                        console.debug(
                            '[LogBookSwiper] pagination element:',
                            pag,
                            'pw=',
                            pw,
                            'count=',
                            count,
                            'computed-size=',
                            size
                        );
                        // eslint-disable-next-line no-console
                        console.debug('[LogBookSwiper] wrapper vars', {
                            bullet: getComputedStyle(el).getPropertyValue('--sw-bullet-size'),
                            font: getComputedStyle(el).getPropertyValue('--sw-bullet-font-size'),
                        });
                    } catch (e) {}
                } else if (typeof width === 'number') {
                    size = Math.max(12, Math.min(28, Math.round(width * 0.06)));
                } else if (typeof height === 'number') {
                    size = Math.max(12, Math.min(28, Math.round(height * 0.12)));
                } else if (bulletSizeVal) {
                    size = parseInt(String(bulletSizeVal), 10);
                } else {
                    size = 12;
                }
                if (size) {
                    el.style.setProperty('--sw-bullet-size', `${size}px`);
                    // also update derived font-size so numbers scale when bullet size changes
                    const f = Math.max(10, Math.round(size * 0.7));
                    el.style.setProperty('--sw-bullet-font-size', `${f}px`);
                }
            } catch (e) {
                // ignore
            }
        };

        updateBullet();
        const ro2 = new ResizeObserver(updateBullet);
        ro2.observe(el);
        const pagEl =
            el.querySelector('.swiper .swiper-pagination') ||
            el.querySelector('.swiper-pagination');
        if (pagEl) ro2.observe(pagEl);

        return () => ro2.disconnect();
    }, [items.length, width, height]);

    const parseSize = (v, fallback) => {
        if (v === undefined || v === null) return fallback;
        return typeof v === 'number' ? `${v}px` : v;
    };

    const widthVal = parseSize(width, '100%');
    const heightVal = parseSize(height, '100%');

    // Compute a reasonable bullet size based on height (if numeric). Keep within min/max.
    let bulletSizeVal = undefined;
    if (typeof height === 'number') {
        bulletSizeVal = Math.max(12, Math.min(28, Math.round(height * 0.12)));
    }

    const defaultBullet = bulletSizeVal || 10;
    const wrapperStyle = {
        width: '100%',
        height: heightVal,
        ['--sw-bullet-size']: `${defaultBullet}px`,
        ['--sw-bullet-font-size']: `${Math.max(10, Math.round(defaultBullet * 0.7))}px`,
    };
    const wrapperClass =
        'wrapper-swiper' +
        (hasCustomRenderBullet ? ' pagination-custom' : '') +
        (swiperClassName ? ` ${swiperClassName}` : '');

    return (
        <div ref={containerRef} style={wrapperStyle} className={wrapperClass}>
            {/* allow Swiper to render its own pagination element */}
            <Swiper
                {...swiperProps}
                onSwiper={(s) => {
                    swiperRef.current = s;
                    try {
                        // attach lightweight debug listeners to inspect swipe deltas
                        if (s && typeof s.on === 'function') {
                            s.on('touchMove', function (event) {
                                try {
                                    const sw = this || s;
                                    const delta =
                                        sw &&
                                        sw.touches &&
                                        typeof sw.touches.currentX === 'number' &&
                                        typeof sw.touches.startX === 'number'
                                            ? sw.touches.currentX - sw.touches.startX
                                            : undefined;
                                    console.debug(
                                        '[LogBookSwiper] touchMove deltaX=',
                                        delta,
                                        'activeIndex=',
                                        sw.activeIndex
                                    );
                                } catch (e) {}
                            });
                            s.on('slideChangeTransitionStart', function () {
                                try {
                                    const sw = this || s;
                                    console.debug(
                                        '[LogBookSwiper] slideChange start active=',
                                        sw.activeIndex,
                                        'prev=',
                                        sw.previousIndex
                                    );
                                } catch (e) {}
                            });
                            // Tinder-specific correction: if wrapper has .tinder-swiper and
                            // the native swipe didn't change slide, enforce left->prev, right->next
                            try {
                                const wrapper = containerRef.current;
                                if (wrapper && wrapper.classList && wrapper.classList.contains('tinder-swiper')) {
                                    if (!s.__tinderHandlerAttached) {
                                        s.__tinderHandlerAttached = true;
                                        let _startX = null;
                                        s.on('touchStart', function (ev) {
                                            try {
                                                const touch = ev && ev.touches && ev.touches[0];
                                                _startX = touch ? touch.clientX : (this && this.touches && this.touches.startX) || null;
                                            } catch (e) {
                                                _startX = null;
                                            }
                                        });
                                        s.on('touchEnd', function (ev) {
                                            try {
                                                const touch = ev && ev.changedTouches && ev.changedTouches[0];
                                                const endX = touch ? touch.clientX : (this && this.touches && this.touches.currentX) || null;
                                                if (_startX == null || endX == null) return;
                                                const delta = endX - _startX;
                                                const threshold = 40; // px
                                                // if native didn't trigger a slide change, enforce mapping
                                                if (Math.abs(delta) > threshold && this.previousIndex === this.activeIndex) {
                                                    if (delta < 0) {
                                                        // finger moved left -> treat as PREV
                                                        try {
                                                            this.slidePrev();
                                                        } catch (e) {}
                                                    } else {
                                                        // finger moved right -> treat as NEXT
                                                        try {
                                                            this.slideNext();
                                                        } catch (e) {}
                                                    }
                                                }
                                            } catch (e) {}
                                        });
                                    }
                                }
                            } catch (e) {}
                        }
                    } catch (err) {}
                }}
            >
                {items.map((s, i) => (
                    <SwiperSlide key={s.id || i}>
                        <div className='slide-inner'>
                            {s.src ? (
                                <img src={s.src} alt={s.title || `slide-${i + 1}`} />
                            ) : (
                                <strong>{s.title || `Slide ${i + 1}`}</strong>
                            )}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}
