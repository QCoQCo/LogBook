import React, { useState, useEffect } from 'react';
import './SwiperFeatureControls.scss';

const defaultFeatures = {
    navigation: true,
    pagination: true,
    autoplay: false,
    autoplayDelay: 4000,
    loop: false,
    effect: 'slide',
    slidesPerView: 1,
};

export default function SwiperFeatureControls({ value, onChange }) {
    const [features, setFeatures] = useState({ ...defaultFeatures, ...(value || {}) });

    useEffect(() => {
        if (onChange) onChange(features);
    }, [features]);

    const set = (k, v) => setFeatures((s) => ({ ...s, [k]: v }));

    return (
        <div className='swiper-feature-controls'>
            <h4>Swiper 기능 설정</h4>
            <div className='feature-row'>
                <label>
                    <input
                        type='checkbox'
                        checked={features.navigation}
                        onChange={(e) => set('navigation', e.target.checked)}
                    />
                    Navigation (이전/다음 버튼)
                </label>
            </div>

            <div className='feature-row'>
                <label>
                    <input
                        type='checkbox'
                        checked={features.pagination}
                        onChange={(e) => set('pagination', e.target.checked)}
                    />
                    Pagination (점 표시)
                </label>
            </div>

            <div className='feature-row'>
                <label>
                    <input
                        type='checkbox'
                        checked={features.autoplay}
                        onChange={(e) => set('autoplay', e.target.checked)}
                    />
                    Autoplay
                </label>
                {features.autoplay && (
                    <input
                        className='small-input'
                        type='number'
                        value={features.autoplayDelay}
                        onChange={(e) => set('autoplayDelay', Number(e.target.value || 0))}
                        min={500}
                        step={100}
                    />
                )}
            </div>

            <div className='feature-row'>
                <label>
                    <input
                        type='checkbox'
                        checked={features.loop}
                        onChange={(e) => set('loop', e.target.checked)}
                    />
                    Loop
                </label>
            </div>

            <div className='feature-row'>
                <label>Effect</label>
                <select value={features.effect} onChange={(e) => set('effect', e.target.value)}>
                    <option value='slide'>Slide</option>
                    <option value='fade'>Fade</option>
                    <option value='cube'>Cube</option>
                    <option value='coverflow'>Coverflow</option>
                </select>
            </div>

            <div className='feature-row'>
                <label>Slides per view</label>
                <input
                    className='small-input'
                    type='number'
                    value={features.slidesPerView}
                    onChange={(e) => set('slidesPerView', Math.max(1, Number(e.target.value || 1)))}
                    min={1}
                    max={5}
                />
            </div>

            <div className='feature-note'>
                이 컨트롤은 설정 UI입니다. 실제 Swiper에 연결하려면 상위 컴포넌트에서 전달된 설정을
                받아 Swiper에 적용하세요.
            </div>
        </div>
    );
}
