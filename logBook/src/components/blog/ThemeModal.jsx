import { ChromePicker } from 'react-color';
import { useEffect, useState } from 'react';

const ThemeModal = ({ color, setColor, onClose }) => {
    const [tempColor, setTempColor] = useState(color);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
            if (e.key === 'Enter') {
                handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tempColor]);

    const handleSave = () => {
        setColor(tempColor); // 부모에 반영
        onClose(); // 모달 닫기
    };

    return (
        <div className="theme-modal-overlay" onClick={onClose}>
            <div className="modal-top">
                <img
                    className="theme-modal-icon"
                    src="/img/icons8-color-picker-64.png"
                    alt="아이콘"
                />
                <button className="close-modal-btn" onClick={onClose}>
                    모달 닫기
                </button>
            </div>
            <div className="theme-modal" onClick={(e) => e.stopPropagation()}>
                <h3>🎨 블로그 테마 색상 선택</h3>

                <ChromePicker color={tempColor} onChange={(c) => setTempColor(c.hex)} />

                <button className="save-theme-btn" onClick={handleSave}>
                    저장
                </button>
            </div>
        </div>
    );
};

export default ThemeModal;
