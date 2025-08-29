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
    width = 240,
    height = 140,
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
    if (showNav) modules.push(Navigation);
    if (showPagination) modules.push(Pagination);
    if (showScrollbar) modules.push(Scrollbar);
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

    const swiperProps = {
        modules,
        navigation: showNav || false,
        pagination: showPagination ? { clickable: true } : false,
        scrollbar: showScrollbar ? { draggable: true } : false,
        autoplay: autoplay ? { delay: autoplayDelay, disableOnInteraction: false } : false,
        effect: effect === 'slide' ? 'slide' : effect,
        className: `swiper effect-${effect}`,
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

    const wrapperStyle = {
        width: typeof width === 'number' ? `${width}px` : width || '100%',
        height: typeof height === 'number' ? `${height}px` : height || '100%',
    };

    return (
        <div ref={containerRef} style={wrapperStyle} className='swiper-wrapper'>
            <Swiper {...swiperProps} onSwiper={(s) => (swiperRef.current = s)}>
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
