import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import AdminList from './AdminList';
import AdminListBtns from './AdminListBtns';

const USER_COLUMNS = [
    { key: 'id', label: 'ID' },
    { key: 'loginId', label: '로그인ID' },
    { key: 'nickName', label: '닉네임' },
    { key: 'userEmail', label: '이메일' },
    {
        key: 'role',
        label: '역할',
        render: (value) => (
            <span className={`user-role user-role--${(value || '').toLowerCase()}`}>
                {value || '-'}
            </span>
        ),
    },
];

const ROLES = [
    { value: 'USER', label: 'USER' },
    { value: 'ADMIN', label: 'ADMIN' },
    { value: 'GUEST', label: 'GUEST' },
];

const UserManage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [editNickName, setEditNickName] = useState('');
    const [editUserEmail, setEditUserEmail] = useState('');
    const [editRole, setEditRole] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await apiClient.get('/users');
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.response?.data?.message || '유저 목록을 불러오는데 실패했습니다.');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEdit = (row) => {
        setEditUser(row);
        setEditNickName(row.nickName || '');
        setEditUserEmail(row.userEmail || '');
        setEditRole(row.role || 'USER');
    };

    const handleEditClose = () => {
        setEditUser(null);
        setEditNickName('');
        setEditUserEmail('');
        setEditRole('');
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editUser?.id) return;
        setSubmitLoading(true);
        try {
            await apiClient.patch(`/users/${editUser.id}`, {
                nickName: editNickName.trim() || undefined,
                userEmail: editUserEmail.trim() || undefined,
                role: editRole,
            });
            handleEditClose();
            await fetchUsers();
        } catch (err) {
            alert(err?.response?.data?.message || '수정에 실패했습니다.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (row) => {
        if (!row?.id) return;
        const message = `"${row.nickName || row.loginId}" 회원을 삭제 처리하시겠습니까?`;
        if (!window.confirm(message)) return;
        try {
            await apiClient.delete(`/users/${row.id}`);
            await fetchUsers();
        } catch (err) {
            alert(err?.response?.data?.message || '삭제에 실패했습니다.');
        }
    };

    return (
        <section className='admin-page__content'>
            <h2>유저관리</h2>
            <p className='admin-page__desc'>회원 목록, 역할 변경, 삭제 등 유저 관리 기능</p>
            {error && <p className='admin-page__error' role='alert'>{error}</p>}
            <AdminList
                columns={USER_COLUMNS}
                data={users}
                loading={loading}
                emptyMessage='등록된 회원이 없습니다.'
                actions={{
                    label: '작업',
                    render: (row) => (
                        <AdminListBtns
                            row={row}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ),
                }}
            />

            {editUser && (
                <div className='admin-modal-overlay' onClick={handleEditClose} role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
                    <div className='admin-modal' onClick={(e) => e.stopPropagation()}>
                        <h3 id="edit-user-title">회원 수정</h3>
                        <p className='admin-modal__user'>로그인ID: {editUser.loginId}</p>
                        <form onSubmit={handleEditSubmit}>
                            <label className='admin-modal__label'>
                                닉네임
                                <input
                                    type='text'
                                    value={editNickName}
                                    onChange={(e) => setEditNickName(e.target.value)}
                                    className='admin-modal__input'
                                    placeholder='닉네임'
                                />
                            </label>
                            <label className='admin-modal__label'>
                                이메일
                                <input
                                    type='email'
                                    value={editUserEmail}
                                    onChange={(e) => setEditUserEmail(e.target.value)}
                                    className='admin-modal__input'
                                    placeholder='이메일'
                                />
                            </label>
                            <label className='admin-modal__label'>
                                역할
                                <select
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    className='admin-modal__select'
                                >
                                    {ROLES.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className='admin-modal__actions'>
                                <button type='button' onClick={handleEditClose} className='admin-modal__btn'>
                                    취소
                                </button>
                                <button type='submit' disabled={submitLoading} className='admin-modal__btn admin-modal__btn--primary'>
                                    {submitLoading ? '저장 중...' : '저장'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default UserManage;
