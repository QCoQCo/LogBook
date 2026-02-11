import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import './StatsManage.scss';

const COLORS = ['#0d9488', '#4ecdc4', '#6b7280', '#f59e0b'];

const StatsManage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [summary, setSummary] = useState({
        userCount: 0,
        postCount: 0,
        reportCount: 0,
        chatroomCount: 0,
    });
    const [roleDistribution, setRoleDistribution] = useState([]);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [usersRes, postsCountRes, reportsRes, chatRoomsRes] = await Promise.all([
                apiClient.get('/users'),
                apiClient.get('/posts/count'),
                apiClient.get('/reports'),
                apiClient.get('/chat/chat-rooms'),
            ]);

            const users = Array.isArray(usersRes.data) ? usersRes.data : [];
            const postCount = postsCountRes.data?.totalElements ?? 0;
            const reports = Array.isArray(reportsRes.data) ? reportsRes.data : [];
            const chatRooms = chatRoomsRes.data?.chatRooms ?? chatRoomsRes.data ?? [];
            const chatroomCount = Array.isArray(chatRooms) ? chatRooms.length : 0;

            setSummary({
                userCount: users.length,
                postCount,
                reportCount: reports.length,
                chatroomCount,
            });

            const roleCount = {};
            users.forEach((u) => {
                const role = u.role || 'USER';
                roleCount[role] = (roleCount[role] || 0) + 1;
            });
            setRoleDistribution(
                Object.entries(roleCount).map(([name, value]) => ({ name, value }))
            );
        } catch (err) {
            setError(err?.response?.data?.message || '통계를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const barData = [
        { name: '유저', count: summary.userCount, fill: COLORS[0] },
        { name: '게시글', count: summary.postCount, fill: COLORS[1] },
        { name: '신고', count: summary.reportCount, fill: COLORS[2] },
        { name: '채팅방', count: summary.chatroomCount, fill: COLORS[3] },
    ];

    const ROLE_LABELS = { USER: '일반회원', ADMIN: '관리자', GUEST: '게스트' };

    if (loading) {
        return (
            <section className="admin-page__content stats-manage">
                <h2>통계</h2>
                <p className="stats-manage__loading">불러오는 중...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className="admin-page__content stats-manage">
                <h2>통계</h2>
                <p className="admin-page__error">{error}</p>
            </section>
        );
    }

    return (
        <section className="admin-page__content stats-manage">
            <h2>통계</h2>
            <p>가입자 수, 게시글 수, 채팅 이용 현황 등</p>

            <div className="stats-manage__cards">
                <div className="stats-manage__card">
                    <span className="stats-manage__card-label">유저</span>
                    <span className="stats-manage__card-value">{summary.userCount}</span>
                </div>
                <div className="stats-manage__card">
                    <span className="stats-manage__card-label">게시글</span>
                    <span className="stats-manage__card-value">{summary.postCount}</span>
                </div>
                <div className="stats-manage__card">
                    <span className="stats-manage__card-label">신고</span>
                    <span className="stats-manage__card-value">{summary.reportCount}</span>
                </div>
                <div className="stats-manage__card">
                    <span className="stats-manage__card-label">채팅방</span>
                    <span className="stats-manage__card-value">{summary.chatroomCount}</span>
                </div>
            </div>

            <div className="stats-manage__charts">
                <div className="stats-manage__chart-box">
                    <h3 className="stats-manage__chart-title">항목별 현황</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={barData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="stats-manage__chart-box">
                    <h3 className="stats-manage__chart-title">유저 역할 분포</h3>
                    {roleDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={roleDistribution}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    label={({ name, value }) =>
                                        `${ROLE_LABELS[name] ?? name}: ${value}`
                                    }
                                >
                                    {roleDistribution.map((_, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [value, '명']} />
                                <Legend
                                    formatter={(value) => ROLE_LABELS[value] ?? value}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="stats-manage__empty">유저 데이터가 없습니다.</p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default StatsManage;
