import { useState } from 'react';
import {
    UserManage,
    PostManage,
    ReportManage,
    ChatroomManage,
    StatsManage,
    CommonCodeManage,
} from '../admin';
import './AdminPage.scss';

const TABS = [
    { id: 'users', label: '유저관리' },
    { id: 'posts', label: '게시글 관리' },
    { id: 'reports', label: '신고관리' },
    { id: 'chatrooms', label: '채팅방 관리' },
    { id: 'commoncode', label: '공통코드관리' },
    { id: 'stats', label: '통계' },
];

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div className='admin-page'>
            <header className='admin-page__header'>
                <h1>관리자 페이지</h1>
                <p>관리자 전용 기능을 탭에서 선택하세요.</p>
            </header>

            <nav className='admin-page__tabs' role='tablist' aria-label='관리 메뉴'>
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type='button'
                        role='tab'
                        aria-selected={activeTab === tab.id}
                        aria-controls={`panel-${tab.id}`}
                        id={`tab-${tab.id}`}
                        className={`admin-page__tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div
                className='admin-page__panel'
                id={`panel-${activeTab}`}
                role='tabpanel'
                aria-labelledby={`tab-${activeTab}`}
            >
                {activeTab === 'users' && <UserManage />}
                {activeTab === 'posts' && <PostManage />}
                {activeTab === 'reports' && <ReportManage />}
                {activeTab === 'chatrooms' && <ChatroomManage />}
                {activeTab === 'commoncode' && <CommonCodeManage />}
                {activeTab === 'stats' && <StatsManage />}
            </div>
        </div>
    );
};

export default AdminPage;
