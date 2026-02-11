import './AdminPagination.scss';

/**
 * @param {number} currentPage - 0-based
 * @param {number} totalPages
 * @param {number} totalElements
 * @param {number} size - page size
 * @param {Function} onPageChange - (page: number) => void
 */
const AdminPagination = ({
    currentPage,
    totalPages,
    totalElements,
    size,
    onPageChange,
}) => {
    if (totalPages <= 0) return null;

    const start = currentPage * size + 1;
    const end = Math.min((currentPage + 1) * size, totalElements);

    const showPrev = currentPage > 0;
    const showNext = currentPage < totalPages - 1;

    const getPageNumbers = () => {
        const maxVisible = 5;
        let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(0, endPage - maxVisible + 1);
        }
        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <nav className='admin-pagination' aria-label='페이지 네비게이션'>
            <p className='admin-pagination__info'>
                전체 {totalElements}건 중 {totalElements > 0 ? `${start}-${end}` : '0'}
            </p>
            <div className='admin-pagination__buttons'>
                <button
                    type='button'
                    className='admin-pagination__btn'
                    disabled={!showPrev}
                    onClick={() => onPageChange(currentPage - 1)}
                    aria-label='이전 페이지'
                >
                    이전
                </button>
                <ul className='admin-pagination__list'>
                    {getPageNumbers().map((p) => (
                        <li key={p}>
                            <button
                                type='button'
                                className={`admin-pagination__btn admin-pagination__btn--num ${p === currentPage ? 'active' : ''}`}
                                onClick={() => onPageChange(p)}
                                aria-label={`${p + 1}페이지`}
                                aria-current={p === currentPage ? 'page' : undefined}
                            >
                                {p + 1}
                            </button>
                        </li>
                    ))}
                </ul>
                <button
                    type='button'
                    className='admin-pagination__btn'
                    disabled={!showNext}
                    onClick={() => onPageChange(currentPage + 1)}
                    aria-label='다음 페이지'
                >
                    다음
                </button>
            </div>
        </nav>
    );
};

export default AdminPagination;
