import './AdminList.scss';
import AdminListBtns from './AdminListBtns';

/**
 * 관리자 목록 공통 컴포넌트
 * @param {Object} props
 * @param {Array<{ key: string, label: string, render?: (value, row) => ReactNode }>} props.columns - 컬럼 정의
 * @param {Array<Object>} props.data - 목록 데이터
 * @param {boolean} [props.loading] - 로딩 여부
 * @param {string} [props.emptyMessage] - 데이터 없을 때 메시지
 * @param {boolean|{ label?: string, render?: (row) => ReactNode }} [props.actions] - 행별 액션 버튼. true면 기본 AdminListBtns 표시
 * @param {Function} [props.getRowClassName] - (row) => string - 행별 추가 클래스
 * @param {Function} [props.onRowClick] - (row) => void - 행 클릭 시
 */
const AdminList = ({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = '데이터가 없습니다.',
    actions = false,
    getRowClassName,
    onRowClick,
}) => {
    if (loading) {
        return (
            <div className='admin-list admin-list--loading'>
                <p>불러오는 중...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className='admin-list admin-list--empty'>
                <p>{emptyMessage}</p>
            </div>
        );
    }

    const actionsConfig =
        typeof actions === 'object' && actions !== null ? actions : { label: '작업' };
    const actionsLabel = actionsConfig.label ?? '작업';
    const renderActions = (row) => {
        if (typeof actions === 'boolean' && actions) {
            return <AdminListBtns row={row} />;
        }
        if (
            typeof actions === 'object' &&
            actions !== null &&
            typeof actionsConfig.render === 'function'
        ) {
            return actionsConfig.render(row);
        }
        return null;
    };
    const hasActions = actions === true || (typeof actions === 'object' && actions !== null);

    return (
        <div className='admin-list'>
            <table className='admin-list__table'>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className='admin-list__th'>
                                {col.label}
                            </th>
                        ))}
                        {hasActions && <th className='admin-list__th'>{actionsLabel}</th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => {
                        const extraClass =
                            typeof getRowClassName === 'function' ? getRowClassName(row) : '';
                        return (
                            <tr
                                key={row.id ?? rowIndex}
                                className={`admin-list__tr ${extraClass || ''}`.trim()}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                role={onRowClick ? 'button' : undefined}
                                tabIndex={onRowClick ? 0 : undefined}
                                onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                                style={onRowClick ? { cursor: 'pointer' } : undefined}
                            >
                                {columns.map((col) => {
                                    const value = row[col.key];
                                    const cell = col.render ? col.render(value, row) : value;
                                    return (
                                        <td key={col.key} className='admin-list__td'>
                                            {cell}
                                        </td>
                                    );
                                })}
                                {hasActions && (
                                    <td className='admin-list__td admin-list__td--actions'>
                                        {renderActions(row)}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default AdminList;
