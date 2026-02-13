import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../../utils/apiClient';
import './CommonCodeManage.scss';

const CommonCodeManage = () => {
    const [commonCodes, setCommonCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState({});

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

    const groupedByGroup = useMemo(() => {
        const map = new Map();
        commonCodes.forEach((c) => {
            const key = c.groupCode;
            if (!map.has(key)) {
                map.set(key, { groupCode: c.groupCode, groupName: c.groupName, codes: [] });
            }
            map.get(key).codes.push(c);
        });
        return Array.from(map.values()).sort((a, b) =>
            String(a.groupCode).localeCompare(String(b.groupCode))
        );
    }, [commonCodes]);

    const toggleGroup = (groupCode) => {
        setExpandedGroups((prev) => ({ ...prev, [groupCode]: !prev[groupCode] }));
    };

    if (loading) {
        return (
            <section className="admin-page__content commoncode-manage">
                <h2>공통코드관리</h2>
                <p className="commoncode-manage__loading">불러오는 중...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="admin-page__content commoncode-manage">
                <h2>공통코드관리</h2>
                <p className="admin-page__error">{error}</p>
            </section>
        );
    }

    if (groupedByGroup.length === 0) {
        return (
            <section className="admin-page__content commoncode-manage">
                <h2>공통코드관리</h2>
                <p>공통코드 목록 (그룹별 토글)</p>
                <p className="commoncode-manage__empty">등록된 공통코드가 없습니다.</p>
            </section>
        );
    }

    return (
        <section className="admin-page__content commoncode-manage">
            <h2>공통코드관리</h2>
            <p>공통코드 목록 (그룹별 토글, 기본 접힘)</p>
            <div className="commoncode-manage__table">
                <table className="commoncode-manage__table-inner">
                    <thead>
                        <tr>
                            <th className="commoncode-manage__th commoncode-manage__th--toggle" />
                            <th className="commoncode-manage__th">그룹코드</th>
                            <th className="commoncode-manage__th">그룹명</th>
                            <th className="commoncode-manage__th">코드값</th>
                            <th className="commoncode-manage__th">코드명</th>
                            <th className="commoncode-manage__th">정렬순서</th>
                            <th className="commoncode-manage__th">사용여부</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedByGroup.map((group) => {
                            const isExpanded = expandedGroups[group.groupCode] ?? false;
                            return (
                                <React.Fragment key={group.groupCode}>
                                    <tr
                                        className="commoncode-manage__parent-row"
                                        onClick={() => toggleGroup(group.groupCode)}
                                    >
                                        <td className="commoncode-manage__td commoncode-manage__td--toggle">
                                            <span
                                                className={`commoncode-manage__toggle ${
                                                    isExpanded ? 'expanded' : ''
                                                }`}
                                            >
                                                ▶
                                            </span>
                                        </td>
                                        <td className="commoncode-manage__td commoncode-manage__td--group">
                                            {group.groupCode}
                                        </td>
                                        <td className="commoncode-manage__td commoncode-manage__td--group">
                                            {group.groupName}
                                        </td>
                                        <td className="commoncode-manage__td" colSpan={3}>
                                            <span className="commoncode-manage__parent-label">
                                                ({group.codes.length}개 코드)
                                            </span>
                                        </td>
                                        <td className="commoncode-manage__td" />
                                    </tr>
                                    {isExpanded &&
                                        group.codes.map((c) => (
                                            <tr key={`${c.groupCode}-${c.codeValue}`} className="commoncode-manage__child-row">
                                                <td className="commoncode-manage__td commoncode-manage__td--toggle" />
                                                <td className="commoncode-manage__td commoncode-manage__td--indent">{c.groupCode}</td>
                                                <td className="commoncode-manage__td commoncode-manage__td--indent">{c.groupName}</td>
                                                <td className="commoncode-manage__td">{c.codeValue}</td>
                                                <td className="commoncode-manage__td">{c.codeName}</td>
                                                <td className="commoncode-manage__td">{c.sortOrder ?? '-'}</td>
                                                <td className="commoncode-manage__td">
                                                    <span
                                                        className={`commoncode-manage__use commoncode-manage__use--${(c.useYn || 'N').toLowerCase()}`}
                                                    >
                                                        {c.useYn === 'Y' ? 'Y' : 'N'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default CommonCodeManage;
