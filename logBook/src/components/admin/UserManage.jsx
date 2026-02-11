import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import AdminList from './AdminList';
import AdminModal from './AdminModal';

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

const UserManage = () => {
    const [users, setUsers] = useState([]);
    const [roleOptions, setRoleOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [editNickName, setEditNickName] = useState('');
    const [editUserEmail, setEditUserEmail] = useState('');
    const [editRole, setEditRole] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);

    const fetchRoleOptions = useCallback(async () => {
        try {
            const { data } = await apiClient.get('/common-codes', { params: { groupCode: 'R' } });
            const list = Array.isArray(data) ? data : [];
            setRoleOptions(list.map((c) => ({ value: c.codeValue, label: c.codeName || c.codeValue })));
        } catch {
            setRoleOptions([
                { value: 'USER', label: '일반회원' },
                { value: 'ADMIN', label: '관리자' },
                { value: 'GUEST', label: '게스트' },
            ]);
        }
    }, []);

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
        fetchRoleOptions();
    }, [fetchRoleOptions]);

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
            handleEditClose();
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
                onRowClick={handleEdit}
            />

            < AdminModal
                isOpen={!!editUser}
                onClose={handleEditClose}
                title="회원 상세"
                titleId="edit-user-title"
            >
                <div className='admin-modal__user-info'>
                    <p className='admin-modal__user'>로그인ID: {editUser?.loginId}</p>
                </div>
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
                            {roleOptions.map((r) => (
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
                            {submitLoading ? '저장 중...' : '수정'}
                        </button>
                        <button
                            type='button'
                            onClick={() => handleDelete(editUser)}
                            className='admin-modal__btn admin-modal__btn--danger'
                        >
                            삭제
                        </button>
                    </div>
                </form>
            </AdminModal>
        </section>
    );
};

export default UserManage;
