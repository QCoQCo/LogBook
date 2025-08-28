import React, { useState } from 'react';
import './SimpleSwiper.scss';

export default function SimpleSwiper({ slides = [], width = 240, height = 140 }) {
    const [idx, setIdx] = useState(0);
    const total = slides.length || 3;

    const prev = () => setIdx((i) => (i - 1 + total) % total);
    const next = () => setIdx((i) => (i + 1) % total);

    const items = slides.length
        ? slides
        : [
              { id: 1, title: 'Slide 1' },
              { id: 2, title: 'Slide 2' },
              { id: 3, title: 'Slide 3' },
          ];

    return (
        <div className='simple-swiper' style={{ width, height }}>
            <div className='slides' style={{ transform: `translateX(-${idx * 100}%)` }}>
                {items.map((s, i) => (
                    <div className='slide' key={s.id || i}>
                        <div className='slide-inner'>
                            <strong>{s.title || `Slide ${i + 1}`}</strong>
                        </div>
                    </div>
                ))}
            </div>
            <button className='sw-btn prev' onClick={prev} aria-label='prev'>
                ‹
            </button>
            <button className='sw-btn next' onClick={next} aria-label='next'>
                ›
            </button>
            <div className='pagination'>
                {items.map((_, i) => (
                    <button
                        key={i}
                        className={`dot ${i === idx ? 'active' : ''}`}
                        onClick={() => setIdx(i)}
                        aria-label={`go to ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
