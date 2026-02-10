import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import AdminList from './AdminList';
import './ReportManage.scss';

const REPORT_REASON_LABELS = {
    spam: '스팸/광고',
    harassment: '괴롭힘/혐오발언',
    inappropriate: '부적절한 내용',
    impersonation: '사칭/가짜계정',
    other: '기타',
};

const REPORT_STATUS_LABELS = {
    PENDING: '대기',
    PROCESSED: '처리완료',
    REJECTED: '반려',
};

const REPORT_COLUMNS = [
    { key: 'id', label: '신고 ID' },
    { key: 'reporterLoginId', label: '신고자 로그인ID' },
    { key: 'reportedUserLoginId', label: '피신고자 로그인ID' },
    { key: 'reportedUserNickName', label: '피신고자 닉네임' },
    {
        key: 'reason',
        label: '신고 사유',
        render: (value) => (
            <span>{REPORT_REASON_LABELS[value] ?? value ?? '-'}</span>
        ),
    },
    {
        key: 'description',
        label: '상세 설명',
        render: (value) => (
            <span className='report-manage__description'>
                {value && value.length > 40 ? value.slice(0, 40) + '…' : value || '-'}
            </span>
        ),
    },
    {
        key: 'status',
        label: '상태',
        render: (value) => (
            <span className={`report-manage__status report-manage__status--${(value || 'PENDING').toLowerCase()}`}>
                {REPORT_STATUS_LABELS[value] ?? value ?? '대기'}
            </span>
        ),
    },
    {
        key: 'createdAt',
        label: '신고 일시',
        render: (value) => {
            if (!value) return '-';
            try {
                const d = new Date(value);
                return isNaN(d.getTime()) ? value : d.toLocaleString('ko-KR');
            } catch {
                return value;
            }
        },
    },
];

const ReportManage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [processModalOpen, setProcessModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [processType, setProcessType] = useState('warning');
    const [processNote, setProcessNote] = useState('');
    const [suspendDays, setSuspendDays] = useState('3');

    const fetchReports = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await apiClient.get('/reports');
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.response?.data?.message || '신고 목록을 불러오는데 실패했습니다.');
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleOpenProcessModal = useCallback((report) => {
        setSelectedReport(report);
        setProcessType('warning');
        setProcessNote('');
        setSuspendDays('3');
        setProcessModalOpen(true);
    }, []);

    const handleCloseProcessModal = useCallback(() => {
        setProcessModalOpen(false);
        setSelectedReport(null);
        setProcessType('warning');
        setProcessNote('');
        setSuspendDays('3');
    }, []);

    const handleProcessSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedReport) return;

        setActionLoadingId(selectedReport.id);
        try {
            // TODO: 처리 방식에 따른 실제 액션 (경고, 정지, 삭제)
            // 현재는 신고 상태만 PROCESSED로 변경
            await apiClient.patch(`/reports/${selectedReport.id}`, { 
                status: 'PROCESSED',
                processType,
                processNote: processNote.trim() || undefined,
                suspendDays: processType === 'suspend' ? Number(suspendDays) : undefined,
            });
            await fetchReports();
            handleCloseProcessModal();
            alert('신고가 처리되었습니다.');
        } catch (err) {
            alert(err?.response?.data?.message || '신고 처리에 실패했습니다.');
        } finally {
            setActionLoadingId(null);
        }
    }, [selectedReport, processType, processNote, suspendDays, fetchReports, handleCloseProcessModal]);

    const handleUpdateStatus = useCallback(async (reportId, status) => {
        setActionLoadingId(reportId);
        try {
            await apiClient.patch(`/reports/${reportId}`, { status });
            await fetchReports();
        } catch (err) {
            alert(err?.response?.data?.message || '상태 변경에 실패했습니다.');
        } finally {
            setActionLoadingId(null);
        }
    }, [fetchReports]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const reportActions = {
        label: '처리',
        render: (row) => {
            const isPending = (row.status || 'PENDING') === 'PENDING';
            const loading = actionLoadingId === row.id;
            if (!isPending) {
                return <span className="report-manage__done">완료</span>;
            }
            return (
                <div className="report-manage__actions">
                    <button
                        type="button"
                        className="report-manage__btn report-manage__btn--process"
                        disabled={loading}
                        onClick={() => handleOpenProcessModal(row)}
                    >
                        {loading ? '처리 중…' : '처리'}
                    </button>
                    <button
                        type="button"
                        className="report-manage__btn report-manage__btn--reject"
                        disabled={loading}
                        onClick={() => handleUpdateStatus(row.id, 'REJECTED')}
                    >
                        반려
                    </button>
                </div>
            );
        },
    };

    if (error) {
        return (
            <section className='admin-page__content'>
                <h2>신고관리</h2>
                <p className='admin-page__error'>{error}</p>
            </section>
        );
    }

    return (
        <section className='admin-page__content'>
            <h2>신고관리</h2>
            <p>사용자 신고 목록 (최신순)</p>
            <AdminList
                columns={REPORT_COLUMNS}
                data={reports}
                loading={loading}
                emptyMessage='접수된 신고가 없습니다.'
                actions={reportActions}
            />

            {/* 신고 처리 모달 */}
            {processModalOpen && selectedReport && (
                <div className='admin-modal-overlay' onClick={handleCloseProcessModal}>
                    <div className='admin-modal report-process-modal' onClick={(e) => e.stopPropagation()}>
                        <h3>신고 처리</h3>
                        <p className='admin-modal__user'>
                            피신고자: {selectedReport.reportedUserNickName} (@{selectedReport.reportedUserLoginId})
                        </p>
                        <p className='admin-modal__user' style={{ marginTop: '-0.5rem', fontSize: '0.85rem' }}>
                            신고 사유: {REPORT_REASON_LABELS[selectedReport.reason] ?? selectedReport.reason}
                        </p>
                        <form onSubmit={handleProcessSubmit}>
                            <label className='admin-modal__label'>
                                처리 방식
                                <select
                                    value={processType}
                                    onChange={(e) => setProcessType(e.target.value)}
                                    className='admin-modal__select'
                                >
                                    <option value='warning'>경고 (사용자에게 경고만 부여)</option>
                                    <option value='suspend'>일시정지 (계정 정지)</option>
                                    <option value='delete'>계정삭제 (영구 삭제)</option>
                                </select>
                            </label>

                            {processType === 'suspend' && (
                                <label className='admin-modal__label'>
                                    정지 기간
                                    <select
                                        value={suspendDays}
                                        onChange={(e) => setSuspendDays(e.target.value)}
                                        className='admin-modal__select'
                                    >
                                        <option value='1'>1일</option>
                                        <option value='3'>3일</option>
                                        <option value='7'>7일</option>
                                        <option value='14'>14일</option>
                                        <option value='30'>30일</option>
                                    </select>
                                </label>
                            )}

                            <label className='admin-modal__label'>
                                처리 메모 (선택)
                                <textarea
                                    value={processNote}
                                    onChange={(e) => setProcessNote(e.target.value)}
                                    className='admin-modal__input report-process-modal__textarea'
                                    placeholder='처리 내용이나 사유를 간단히 작성해주세요.'
                                    rows='3'
                                />
                            </label>

                            <div className='admin-modal__actions'>
                                <button 
                                    type='button' 
                                    onClick={handleCloseProcessModal} 
                                    className='admin-modal__btn'
                                    disabled={actionLoadingId === selectedReport.id}
                                >
                                    취소
                                </button>
                                <button 
                                    type='submit' 
                                    disabled={actionLoadingId === selectedReport.id} 
                                    className='admin-modal__btn admin-modal__btn--primary'
                                >
                                    {actionLoadingId === selectedReport.id ? '처리 중...' : '처리 완료'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default ReportManage;
