import axios from 'axios';
import apiClient from '../../../utils/apiClient';
import { useState, useEffect, useMemo } from 'react';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import './Comments.scss';

const CommentContainer = ({ postId, currentUser, highlightCommentId }) => {
    const [comments, setComments] = useState([]);
    // 현재 답글 작성 창이 열려있는 댓글의 ID (null이면 아무것도 안 열림)
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // 1. 초기 데이터 로드
    const fetchComments = async (isInitial = false) => {
        try {
            if (isInitial) setIsLoading(true);
            const { data } = await axios.get(`/api/posts/${postId}/comments`);
            setComments(data);
        } catch (err) {
            console.error('댓글 로드 실패:', err);
        } finally {
            if (isInitial) setIsLoading(false);
        }
    };

    // 처음 렌더링될 때만 true를 넘겨서 로딩 바를 보여줌
    useEffect(() => {
        if (postId) fetchComments(true);
    }, [postId]);

    // highlightCommentId가 있으면 해당 댓글을 하이라이트 표시
    useEffect(() => {
        if (!highlightCommentId || comments.length === 0) return;
        const el = document.querySelector(`[data-comment-id="${highlightCommentId}"]`);
        if (el) {
            el.classList.add('highlighted');
            const t = setTimeout(() => el.classList.remove('highlighted'), 5000);
            return () => clearTimeout(t);
        }
    }, [highlightCommentId, comments]);

    // 2. 평면 데이터를 계층형 트리 구조로 변환
    const commentTree = useMemo(() => {
        const map = {};
        const roots = [];

        if (Array.isArray(comments) && comments.length > 0) {
            comments.forEach((c) => {
                map[c.id] = { ...c, children: [] };
            });

            comments.forEach((c) => {
                if (c.commentId && map[c.commentId]) {
                    map[c.commentId].children.push(map[c.id]);
                } else if (!c.commentId) {
                    roots.push(map[c.id]);
                }
            });
        }

        return roots;
    }, [comments]);

    // 3. 댓글/답글 등록 핸들러
    const handleCommentSubmit = async (parentId, content) => {
        try {
            await apiClient.post(`/comments/${postId}`, {
                commentId: parentId, // 최상위 댓글은 null
                content,
            });

            // 등록 성공 후 처리
            setActiveReplyId(null); // 답글 창 닫기
            fetchComments(); // 목록 새로고침
        } catch (err) {
            alert('댓글 등록에 실패했습니다.');
            console.error(err);
        }
    };

    // 4. 댓글 수정 핸들러
    const handleCommentEdit = async (commentId, content) => {
        try {
            await apiClient.put(`/comments/${commentId}`, { content });
            fetchComments(); // 목록 새로고침
        } catch (err) {
            alert('댓글 수정에 실패했습니다.');
            console.error(err);
        }
    };

    // 5. 댓글 삭제 핸들러
    const handleCommentDelete = async (commentId) => {
        try {
            await apiClient.delete(`/comments/${commentId}`);
            fetchComments(); // 목록 새로고침
        } catch (err) {
            alert('댓글 삭제에 실패했습니다.');
            console.error(err);
        }
    };

    if (isLoading) {
        return <div className="loading-comments">댓글을 불러오고 있습니다...⌛</div>;
    }

    return (
        <section className="post-comments-section">
            <div className="comments-header-title">
                <h3>댓글 {comments.length}</h3>
            </div>

            {/* 최상위 댓글 입력창 */}
            {currentUser ? (
                <CommentInput
                    onSubmit={handleCommentSubmit}
                    placeholder="따뜻한 댓글을 남겨주세요."
                />
            ) : (
                <div className="login-required-banner">댓글을 작성하려면 로그인이 필요합니다.</div>
            )}

            <div className="comments-list">
                {commentTree.length > 0 ? (
                    commentTree.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onReplySubmit={handleCommentSubmit}
                            onEditSubmit={handleCommentEdit}
                            onDeleteClick={handleCommentDelete}
                            currentUser={currentUser}
                            activeReplyId={activeReplyId}
                            setActiveReplyId={setActiveReplyId}
                            highlightCommentId={highlightCommentId}
                        />
                    ))
                ) : (
                    <div className="empty-comments">첫 번째 댓글의 주인공이 되어보세요! 🚩</div>
                )}
            </div>
        </section>
    );
};

export default CommentContainer;
