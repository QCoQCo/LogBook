import './AdminListBtns.scss';

/**
 * @param {Object} [props.row] - 현재 행 데이터 (AdminList에서 전달)
 * @param {Function} [props.onEdit] - 수정 클릭 시 (row) => void (UserManage 등)
 * @param {Function} [props.onDeactivate] - 비활성화/활성화 클릭 시 (row) => void (PostManage)
 * @param {Function} [props.onDelete] - 삭제 클릭 시 (row) => void
 */
const AdminListBtns = ({ row, onEdit, onDeactivate, onDelete }) => {
    const isActive = row?.isActive !== false;
    return (
        <div className='admin-list-btns'>
            {onDeactivate != null ? (
                <button
                    type='button'
                    className='admin-list-btn'
                    onClick={() => onDeactivate(row)}
                >
                    {isActive ? '비활성화' : '활성화'}
                </button>
            ) : onEdit != null ? (
                <button
                    type='button'
                    className='admin-list-btn'
                    onClick={() => onEdit(row)}
                >
                    수정
                </button>
            ) : null}
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
