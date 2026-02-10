import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import AdminList from './AdminList';
import './CommonCodeManage.scss';

const COMMONCODE_COLUMNS = [
    { key: 'groupCode', label: '그룹코드' },
    { key: 'groupName', label: '그룹명' },
    { key: 'codeValue', label: '코드값' },
    { key: 'codeName', label: '코드명' },
    {
        key: 'sortOrder',
        label: '정렬순서',
        render: (value) => value ?? '-',
    },
    {
        key: 'useYn',
        label: '사용여부',
        render: (value) => (
            <span className={`commoncode-manage__use commoncode-manage__use--${(value || 'N').toLowerCase()}`}>
                {value === 'Y' ? 'Y' : 'N'}
            </span>
        ),
    },
];

const CommonCodeManage = () => {
    const [commonCodes, setCommonCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCommonCodes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await apiClient.get('/common-codes');
            setCommonCodes(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.response?.data?.message || '공통코드 목록을 불러오는데 실패했습니다.');
            setCommonCodes([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCommonCodes();
    }, [fetchCommonCodes]);

    if (error) {
        return (
            <section className="admin-page__content">
                <h2>공통코드관리</h2>
                <p className="admin-page__error">{error}</p>
            </section>
        );
    }

    return (
        <section className="admin-page__content">
            <h2>공통코드관리</h2>
            <p>공통코드 목록 (그룹코드·정렬순)</p>
            <AdminList
                columns={COMMONCODE_COLUMNS}
                data={commonCodes}
                loading={loading}
                emptyMessage="등록된 공통코드가 없습니다."
            />
        </section>
    );
};

export default CommonCodeManage;
