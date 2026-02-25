import { useState } from 'react';
import './PlaylistImportModal.scss';

const extractVideoId = (url) => {
    if (!url) return null;
    try {
        const u = new URL(url);
        return u.searchParams.get('v') || null;
    } catch {
        return null;
    }
};

const PlaylistImportModal = ({ items, existingIds = new Set(), onConfirm, onCancel }) => {
    // 이미 추가된 곡은 기본 체크 해제, 새 곡은 기본 체크
    const [checked, setChecked] = useState(() => {
        const initial = new Set();
        items.forEach((item, i) => {
            const vid = extractVideoId(item.link);
            if (!vid || !existingIds.has(vid)) initial.add(i);
        });
        return initial;
    });

    if (!items || items.length === 0) return null;

    const toggleItem = (idx) => {
        setChecked((prev) => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    const newItems = items.filter((item) => {
        const vid = extractVideoId(item.link);
        return !vid || !existingIds.has(vid);
    });

    const toggleAll = () => {
        const newIdxs = newItems.map((_, i) => items.indexOf(newItems[i]));
        const allNewChecked = newIdxs.every((i) => checked.has(i));
        setChecked((prev) => {
            const next = new Set(prev);
            newIdxs.forEach((i) => (allNewChecked ? next.delete(i) : next.add(i)));
            return next;
        });
    };

    const selectedItems = items.filter((_, i) => checked.has(i));
    const newItemsCheckedCount = newItems.filter((item) => {
        const idx = items.indexOf(item);
        return checked.has(idx);
    }).length;
    const allNewChecked = newItems.length > 0 && newItemsCheckedCount === newItems.length;
    const someNewChecked = newItemsCheckedCount > 0 && !allNewChecked;
    const duplicateCount = items.length - newItems.length;

    return (
        <div className="import-modal-overlay" onClick={onCancel}>
            <div className="import-modal" onClick={(e) => e.stopPropagation()}>
                <div className="import-modal-header">
                    <label className="import-modal-all-check">
                        <input
                            type="checkbox"
                            checked={allNewChecked}
                            ref={(el) => {
                                if (el) el.indeterminate = someNewChecked;
                            }}
                            onChange={toggleAll}
                        />
                        <span className="import-modal-title">
                            총 {items.length}곡
                            {duplicateCount > 0 && (
                                <span className="import-modal-dup-summary">
                                    {' '}
                                    · 이미 추가됨 {duplicateCount}곡
                                </span>
                            )}
                            {' · '}
                            {checked.size}개 선택됨
                        </span>
                    </label>
                    <button className="import-modal-close" onClick={onCancel}>
                        ✕
                    </button>
                </div>
                <ul className="import-modal-list">
                    {items.map((item, idx) => {
                        const vid = extractVideoId(item.link);
                        const isDuplicate = vid && existingIds.has(vid);
                        return (
                            <li
                                key={idx}
                                className={`import-modal-item${checked.has(idx) ? ' checked' : ''}${isDuplicate ? ' duplicate' : ''}`}
                                onClick={() => toggleItem(idx)}
                            >
                                <input
                                    type="checkbox"
                                    className="import-modal-checkbox"
                                    checked={checked.has(idx)}
                                    onChange={() => toggleItem(idx)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {item.thumbnail && (
                                    <img
                                        className="import-modal-thumb"
                                        src={item.thumbnail}
                                        alt="thumb"
                                    />
                                )}
                                <span className="import-modal-item-title">{item.title}</span>
                                {isDuplicate && (
                                    <span className="import-modal-dup-badge">이미 추가됨</span>
                                )}
                            </li>
                        );
                    })}
                </ul>
                <div className="import-modal-footer">
                    <button className="import-modal-cancel" onClick={onCancel}>
                        취소
                    </button>
                    <button
                        className="import-modal-selected"
                        onClick={() => onConfirm(selectedItems)}
                        disabled={checked.size === 0}
                    >
                        선택한 곡만 추가 ({checked.size}개)
                    </button>
                    <button
                        className="import-modal-confirm"
                        onClick={() =>
                            onConfirm(
                                items.filter((item) => {
                                    const vid = extractVideoId(item.link);
                                    return !vid || !existingIds.has(vid);
                                }),
                            )
                        }
                        disabled={newItems.length === 0}
                    >
                        전체 추가 ({newItems.length}개)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlaylistImportModal;
