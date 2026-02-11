import { useState, useCallback, useRef, useEffect } from 'react';
import './AdminList.scss';
import AdminListBtns from './AdminListBtns';

const DEFAULT_COL_WIDTH = 140;
const MIN_COL_WIDTH = 60;
const MAX_COL_WIDTH = 400;

/**
 * 관리자 목록 공통 컴포넌트
 * @param {Object} props
 * @param {Array<{ key: string, label: string, render?: (value, row) => ReactNode }>} props.columns - 컬럼 정의
 * @param {Array<Object>} props.data - 목록 데이터
 * @param {boolean} [props.loading] - 로딩 여부
 * @param {string} [props.emptyMessage] - 데이터 없을 때 메시지
 * @param {boolean|{ label?: string, render?: (row) => ReactNode }} [props.actions] - 행별 액션 버튼. true면 기본 AdminListBtns 표시
 * @param {Function} [props.getRowClassName] - (row) => string - 행별 추가 클래스
 */
const AdminList = ({
    columns = [],
    data = [],
    loading = false,
    emptyMessage = '데이터가 없습니다.',
    actions = false,
    getRowClassName,
}) => {
    const [colWidths, setColWidths] = useState({});
    const resizeRef = useRef({ columnKey: null, startX: 0, startWidth: 0 });

    const getColWidth = useCallback((colKey) => {
        return colWidths[colKey] ?? DEFAULT_COL_WIDTH;
    }, [colWidths]);

    const handleResizeStart = useCallback((colKey, e) => {
        e.preventDefault();
        e.stopPropagation();
        const startWidth = colWidths[colKey] ?? DEFAULT_COL_WIDTH;
        resizeRef.current = { columnKey: colKey, startX: e.clientX, startWidth };
    }, [colWidths]);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { columnKey, startX, startWidth } = resizeRef.current;
            if (!columnKey) return;
            e.preventDefault();
            const delta = e.clientX - startX;
            const newWidth = Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, startWidth + delta));
            setColWidths((prev) => ({ ...prev, [columnKey]: newWidth }));
        };

        const handleMouseUp = () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            resizeRef.current = { columnKey: null, startX: 0, startWidth: 0 };
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleResizeStartWithCursor = useCallback((colKey, e) => {
        handleResizeStart(colKey, e);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [handleResizeStart]);
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

    const actionsConfig = typeof actions === 'object' && actions !== null ? actions : { label: '작업' };
    const actionsLabel = actionsConfig.label ?? '작업';
    const renderActions = (row) => {
        if (typeof actions === 'boolean' && actions) {
            return <AdminListBtns row={row} />;
        }
        if (typeof actions === 'object' && actions !== null && typeof actionsConfig.render === 'function') {
            return actionsConfig.render(row);
        }
        return null;
    };
    const hasActions = actions === true || (typeof actions === 'object' && actions !== null);

    const totalTableWidth = columns.reduce((sum, col) => sum + getColWidth(col.key), 0) + (hasActions ? 100 : 0);

    return (
        <div className='admin-list'>
            <table className='admin-list__table' style={{ width: `${totalTableWidth}px`, minWidth: `${totalTableWidth}px` }}>
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className='admin-list__th'
                                style={{ width: `${getColWidth(col.key)}px` }}
                            >
                                <span className='admin-list__th-label'>{col.label}</span>
                                <span
                                    className='admin-list__th-resize'
                                    onMouseDown={(e) => handleResizeStartWithCursor(col.key, e)}
                                    role='separator'
                                    aria-orientation='vertical'
                                    title='너비 조절'
                                />
                            </th>
                        ))}
                        {hasActions && (
                            <th className='admin-list__th admin-list__th--actions'>{actionsLabel}</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => {
                        const extraClass = typeof getRowClassName === 'function' ? getRowClassName(row) : '';
                        return (
                        <tr key={row.id ?? rowIndex} className={`admin-list__tr ${extraClass || ''}`.trim()}>
                            {columns.map((col) => {
                                const value = row[col.key];
                                const cell = col.render ? col.render(value, row) : value;
                                return (
                                    <td
                                        key={col.key}
                                        className='admin-list__td'
                                        style={{ width: `${getColWidth(col.key)}px` }}
                                    >
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
