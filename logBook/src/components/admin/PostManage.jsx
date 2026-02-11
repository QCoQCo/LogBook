import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import AdminList from './AdminList';
import AdminListBtns from './AdminListBtns';
import AdminPagination from './AdminPagination';

const PAGE_SIZE = 10;

const POST_COLUMNS = [
    { key: 'postId', label: 'ID' },
    {
        key: 'title',
        label: '제목',
        render: (value, row) => (
            <Link
                to={`/post/detail?postId=${row.postId}&fromAdmin=1`}
                className={`post-manage__title-link ${row.isActive === false ? 'post-manage__title-link--inactive' : ''}`}
            >
                {value || '-'}
                {row.isActive === false && (
                    <span className='post-manage__inactive-badge'>비활성화</span>
                )}
            </Link>
        ),
    },
    { key: 'authorName', label: '작성자' },
    {
        key: 'content',
        label: '내용 미리보기',
        render: (value) => (
            <span className='post-manage__preview'>
                {value && typeof value === 'string' ? value.slice(0, 50) + (value.length > 50 ? '…' : '') : '-'}
            </span>
        ),
    },
    { key: 'createdAt', label: '작성일' },
];

const PostManage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const totalPages = Math.max(0, Math.ceil(totalElements / PAGE_SIZE));

    const fetchPosts = useCallback(async (pageNum) => {
        try {
            setLoading(true);
            setError(null);
            const [listRes, countRes] = await Promise.all([
                apiClient.get('/posts', { params: { page: pageNum, size: PAGE_SIZE, includeInactive: true } }),
                apiClient.get('/posts/count', { params: { includeInactive: true } }),
            ]);
            const list = listRes.data;
            const total = countRes.data?.totalElements ?? 0;
            setPosts(Array.isArray(list) ? list.map((p) => ({ ...p, id: p.postId })) : []);
            setTotalElements(total);
        } catch (err) {
            setError(err?.response?.data?.message || '게시글 목록을 불러오는데 실패했습니다.');
            setPosts([]);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts(page);
    }, [page, fetchPosts]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleDeactivate = async (row) => {
        if (!row?.postId) return;
        const action = row.isActive === false ? '활성화' : '비활성화';
        if (!window.confirm(`"${row.title || '이 게시글'}"을(를) ${action}하시겠습니까?`)) return;
        try {
            const endpoint = row.isActive === false
                ? `/posts/${row.postId}/activate`
                : `/posts/${row.postId}/deactivate`;
            await apiClient.patch(endpoint);
            await fetchPosts(page);
        } catch (err) {
            alert(err?.response?.data?.message || `${action}에 실패했습니다.`);
        }
    };

    const handleDelete = async (row) => {
        if (!row?.postId) return;
        if (!window.confirm(`"${row.title || '이 게시글'}"을(를) 삭제 처리하시겠습니까?`)) return;
        try {
            await apiClient.delete(`/posts/${row.postId}`);
            await fetchPosts(page);
        } catch (err) {
            alert(err?.response?.data?.message || '삭제에 실패했습니다.');
        }
    };

    return (
        <section className='admin-page__content'>
            <h2>게시글 관리</h2>
            <p className='admin-page__desc'>
                게시글 목록, 삭제, 숨김 처리 등 게시글 관리 기능 (페이지당 {PAGE_SIZE}건)
            </p>
            {error && (
                <p className='admin-page__error' role='alert'>
                    {error}
                </p>
            )}
            <AdminList
                columns={POST_COLUMNS}
                data={posts}
                loading={loading}
                emptyMessage='등록된 게시글이 없습니다.'
                getRowClassName={(row) => row.isActive === false ? 'admin-list__tr--inactive' : ''}
                actions={{
                    label: '작업',
                    render: (row) => (
                        <AdminListBtns
                            row={row}
                            onDeactivate={handleDeactivate}
                            onDelete={handleDelete}
                        />
                    ),
                }}
            />
            {!loading && totalElements > 0 && (
                <AdminPagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalElements={totalElements}
                    size={PAGE_SIZE}
                    onPageChange={handlePageChange}
                />
            )}
        </section>
    );
};

export default PostManage;
