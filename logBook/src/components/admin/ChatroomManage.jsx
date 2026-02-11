import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import AdminList from './AdminList';
import './ChatroomManage.scss';

const formatDateTime = (value) => {
    if (!value) return '-';
    try {
        const d = new Date(value);
        return isNaN(d.getTime()) ? value : d.toLocaleString('ko-KR');
    } catch {
        return value;
    }
};

const CHATROOM_COLUMNS = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: '방 이름' },
    { key: 'admin', label: '방장(닉네임)' },
    { key: 'loginId', label: '생성자 로그인ID' },
    {
        key: 'isSystem',
        label: '시스템방',
        render: (value) => (
            <span className="chatroom-manage__badge chatroom-manage__badge--system">
                {value ? 'Y' : '-'}
            </span>
        ),
    },
    {
        key: 'description',
        label: '설명',
        render: (value) => (
            <span className="chatroom-manage__description">
                {value && value.length > 30 ? value.slice(0, 30) + '…' : value || '-'}
            </span>
        ),
    },
    {
        key: 'capacity',
        label: '정원',
        render: (value, row) => (
            <span>
                {row.currentUsers != null ? row.currentUsers : 0} / {value ?? 50}
            </span>
        ),
    },
    {
        key: 'isPrivate',
        label: '비공개',
        render: (value) => (
            <span className="chatroom-manage__badge chatroom-manage__badge--private">
                {value ? 'Y' : '-'}
            </span>
        ),
    },
    {
        key: 'createdAt',
        label: '생성일',
        render: (value) => formatDateTime(value),
    },
];

const ChatroomManage = () => {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchChatRooms = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await apiClient.get('/chat/chat-rooms');
            const list = data?.chatRooms ?? data;
            setChatRooms(Array.isArray(list) ? list : []);
        } catch (err) {
            setError(err?.response?.data?.message || '채팅방 목록을 불러오는데 실패했습니다.');
            setChatRooms([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchChatRooms();
    }, [fetchChatRooms]);

    if (error) {
        return (
            <section className="admin-page__content">
                <h2>채팅방 관리</h2>
                <p className="admin-page__error">{error}</p>
            </section>
        );
    }

    return (
        <section className="admin-page__content">
            <h2>채팅방 관리</h2>
            <p>채팅방 목록 (ID순)</p>
            <AdminList
                columns={CHATROOM_COLUMNS}
                data={chatRooms}
                loading={loading}
                emptyMessage="등록된 채팅방이 없습니다."
            />
        </section>
    );
};

export default ChatroomManage;
