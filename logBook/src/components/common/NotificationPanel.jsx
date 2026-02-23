import { useNavigate } from 'react-router-dom';
import { useNotification, useUserData } from '../../context';
import './NotificationPanel.scss';

const TYPE_ICONS = {
    FOLLOW: '👤',
    COMMENT: '💬',
    REPORT_PROCESSED: '✅',
};

const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

const NotificationPanel = ({ onClose }) => {
    const navigate = useNavigate();
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotification();
    const { getUserInfo } = useUserData();

    const handleItemClick = (n) => {
        if (!n.readAt) markAsRead(n.id);
        onClose?.();

        if (n.type === 'FOLLOW' && n.relatedId) {
            const user = getUserInfo(n.relatedId);
            const blogUserId = user?.userId ?? user?.loginId ?? n.relatedId;
            navigate(`/blog?userId=${blogUserId}`);
        } else if (n.type === 'COMMENT' && n.relatedId) {
            navigate(`/post?postId=${n.relatedId}`);
        }
        // REPORT_PROCESSED: 별도 이동 없음
    };

    const handleMarkAllRead = () => {
        markAllAsRead();
    };

    return (
        <div className="notification-panel" role="dialog" aria-label="알림">
            <div className="notification-panel__header">
                <h3>알림</h3>
                {unreadCount > 0 && (
                    <button
                        type="button"
                        className="notification-panel__read-all"
                        onClick={handleMarkAllRead}
                    >
                        전체 읽음
                    </button>
                )}
            </div>

            <div className="notification-panel__list">
                {loading && notifications.length === 0 ? (
                    <div className="notification-panel__empty">알림을 불러오는 중...</div>
                ) : notifications.length === 0 ? (
                    <div className="notification-panel__empty">알림이 없습니다.</div>
                ) : (
                    notifications.map((n) => (
                        <button
                            key={n.id}
                            type="button"
                            className={`notification-panel__item ${!n.readAt ? 'unread' : ''}`}
                            onClick={() => handleItemClick(n)}
                        >
                            <span className="notification-panel__icon">
                                {TYPE_ICONS[n.type] || '🔔'}
                            </span>
                            <div className="notification-panel__content">
                                <span className="notification-panel__title">{n.title}</span>
                                <span className="notification-panel__message">{n.message}</span>
                                <span className="notification-panel__time">
                                    {formatTime(n.createdAt)}
                                </span>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;
