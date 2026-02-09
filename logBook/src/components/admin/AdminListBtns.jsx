import './AdminListBtns.scss';

/**
 * @param {Object} [props.row] - 현재 행 데이터 (AdminList에서 전달)
 * @param {Function} [props.onEdit] - 수정 클릭 시 (row) => void
 * @param {Function} [props.onDelete] - 삭제 클릭 시 (row) => void
 */
const AdminListBtns = ({ row, onEdit, onDelete }) => {
    return (
        <div className='admin-list-btns'>
            <button
                type='button'
                className='admin-list-btn'
                onClick={() => onEdit?.(row)}
            >
                수정
            </button>
            <button
                type='button'
                className='admin-list-btn'
                onClick={() => onDelete?.(row)}
            >
                삭제
            </button>
        </div>
    );
};

export default AdminListBtns;
