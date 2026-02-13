import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './StatsManage.scss';

const COLORS = ['#0d9488', '#4ecdc4', '#6b7280', '#f59e0b', '#14b8a6', '#99f6e4'];

const StatsManage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalPosts: 0,
        userCount: 0,
        reportCount: 0,
        chatroomCount: 0,
        postsByTag: [],
        postsByUser: [],
        chatRooms: [],
    });

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await apiClient.get('/stats');
            setStats({
                totalPosts: data.totalPosts ?? 0,
                userCount: data.userCount ?? 0,
                reportCount: data.reportCount ?? 0,
                chatroomCount: data.chatroomCount ?? 0,
                postsByTag: Array.isArray(data.postsByTag) ? data.postsByTag : [],
                postsByUser: Array.isArray(data.postsByUser) ? data.postsByUser : [],
                chatRooms: Array.isArray(data.chatRooms) ? data.chatRooms : [],
            });
        } catch (err) {
            setError(err?.response?.data?.message || '통계를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const postsByTagData = stats.postsByTag.slice(0, 20).map((t, i) => ({
        name: t.tagName || '-',
        count: t.count ?? 0,
        fill: COLORS[i % COLORS.length],
    }));

    const postsByUserData = stats.postsByUser.slice(0, 15).map((u, i) => ({
        name: (u.userName || 'ID:' + u.userId).slice(0, 12),
        count: u.count ?? 0,
        fill: COLORS[i % COLORS.length],
    }));

    const chatRoomsData = stats.chatRooms.map((r, i) => ({
        name: (r.name || '채팅방').slice(0, 12),
        count: r.currentUsers ?? 0,
        fill: COLORS[i % COLORS.length],
    }));

    if (loading) {
        return (
            <section className='admin-page__content stats-manage'>
                <h2>통계</h2>
                <p className='stats-manage__loading'>불러오는 중...</p>
            </section>
        );
    }

    if (error) {
        return (
            <section className='admin-page__content stats-manage'>
                <h2>통계</h2>
                <p className='admin-page__error'>{error}</p>
            </section>
        );
    }

    return (
        <section className='admin-page__content stats-manage'>
            <h2>통계</h2>
            <p>게시글 수, 태그별 게시글, 유저별 작성 글, 채팅방별 현황</p>

            <div className='stats-manage__cards'>
                <div className='stats-manage__card'>
                    <span className='stats-manage__card-label'>유저</span>
                    <span className='stats-manage__card-value'>{stats.userCount}</span>
                </div>
                <div className='stats-manage__card'>
                    <span className='stats-manage__card-label'>게시글</span>
                    <span className='stats-manage__card-value'>{stats.totalPosts}</span>
                </div>
                <div className='stats-manage__card'>
                    <span className='stats-manage__card-label'>신고</span>
                    <span className='stats-manage__card-value'>{stats.reportCount}</span>
                </div>
                <div className='stats-manage__card'>
                    <span className='stats-manage__card-label'>채팅방</span>
                    <span className='stats-manage__card-value'>{stats.chatroomCount}</span>
                </div>
            </div>

            <div className='stats-manage__charts'>
                <div className='stats-manage__charts-row stats-manage__charts-row--tag-chat'>
                    <div className='stats-manage__chart-box stats-manage__chart-box--tag'>
                        <h3 className='stats-manage__chart-title'>태그별 게시글 수</h3>
                        {postsByTagData.length > 0 ? (
                            <div className='stats-manage__chart-inner' style={{ width: '100%', height: 640 }}>
                                <ResponsiveContainer width='100%' height='100%'>
                                    <BarChart
                                        data={postsByTagData}
                                        layout='vertical'
                                        margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                                    >
                                        <CartesianGrid strokeDasharray='3 3' stroke='#eee' />
                                        <XAxis type='number' tick={{ fontSize: 11 }} />
                                        <YAxis
                                            type='category'
                                            dataKey='name'
                                            width={80}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <Tooltip />
                                        <Bar dataKey='count' fill='#0d9488' radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className='stats-manage__empty'>데이터가 없습니다.</p>
                        )}
                    </div>
                    <div className='stats-manage__chart-box stats-manage__chart-box--chat'>
                        <h3 className='stats-manage__chart-title'>채팅방별 참여자 수 (현재 접속)</h3>
                        {chatRoomsData.length > 0 ? (
                            <div className='stats-manage__chart-inner' style={{ width: '100%', height: 280 }}>
                                <ResponsiveContainer width='100%' height='100%'>
                                    <BarChart
                                        data={chatRoomsData}
                                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray='3 3' stroke='#eee' />
                                        <XAxis dataKey='name' tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip formatter={(value) => [value, '명']} />
                                        <Bar dataKey='count' fill='#6b7280' radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className='stats-manage__empty'>채팅방이 없습니다.</p>
                        )}
                    </div>
                </div>

                <div className='stats-manage__chart-box'>
                    <h3 className='stats-manage__chart-title'>유저별 작성한 글 갯수</h3>
                    {postsByUserData.length > 0 ? (
                        <div className='stats-manage__chart-inner' style={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer width='100%' height='100%'>
                                <BarChart
                                    data={postsByUserData}
                                    layout='vertical'
                                    margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray='3 3' stroke='#eee' />
                                    <XAxis type='number' tick={{ fontSize: 11 }} />
                                    <YAxis
                                        type='category'
                                        dataKey='name'
                                        width={80}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <Tooltip />
                                    <Bar dataKey='count' fill='#4ecdc4' radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className='stats-manage__empty'>데이터가 없습니다.</p>
                    )}
                </div>
            </div>
        </section>
    );
};

export default StatsManage;
