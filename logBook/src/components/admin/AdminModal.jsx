import './AdminModal.scss';

/**
 * 관리자 페이지 공통 모달
 * @param {boolean} isOpen - 모달 표시 여부
 * @param {function} onClose - 닫기 핸들러 (배경 클릭 시 호출)
 * @param {string} title - 모달 제목
 * @param {string} [titleId] - 제목 id (aria-labelledby 접근성용)
 * @param {string} [className] - 모달 내부 박스 추가 클래스 (예: report-process-modal)
 * @param {React.ReactNode} children - 모달 본문
 */
const AdminModal = ({ isOpen, onClose, title, titleId, className = '', children }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div
            className="admin-modal-overlay"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId || undefined}
        >
            <div
                className={`admin-modal ${className}`.trim()}
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id={titleId} className="admin-modal__title">
                    {title}
                </h3>
                {children}
            </div>
        </div>
    );
};

export default AdminModal;
