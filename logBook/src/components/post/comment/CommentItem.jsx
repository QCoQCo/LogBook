import { useState } from 'react';

const CommentItem = ({
    comment,
    onReplySubmit,
    onEditSubmit,
    onDeleteClick,
    currentUser,
    parentAuthor,
    activeReplyId,
    setActiveReplyId,
}) => {
    const [replyContent, setReplyContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const MAX_LENGTH = 500; //

    // 본인의 ID와 부모가 관리하는 activeReplyId가 같은지 확인
    const isReplying = activeReplyId === comment.id;

    const handleAreaClick = () => {
        if (!currentUser || comment.deletedAt) return;
        if (isEditing) return;

        // 이미 열려있으면 닫고(null), 아니면 본인 ID로 설정
        if (isReplying) {
            setActiveReplyId(null);
        } else {
            setActiveReplyId(comment.id);
            setReplyContent(''); // 창을 새로 열 때 내용 초기화
        }
    };

    const handleSubmit = async (e) => {
        e.stopPropagation();
        if (!replyContent.trim()) return;
        await onReplySubmit(comment.id, replyContent);
        setReplyContent('');
        setActiveReplyId(null); // 전송 후 닫기
    };

    const handleClickEdit = (e) => {
        e.stopPropagation(); // 부모 div의 handleAreaClick 방지
        setIsEditing(true);
        setActiveReplyId(null); // 수정 시 답글창은 닫음
    };

    const handleEditSubmit = async (e) => {
        e.stopPropagation();
        if (!editContent.trim() || editContent === comment.content) {
            setIsEditing(false);
            return;
        }
        await onEditSubmit(comment.id, editContent);
        setIsEditing(false);
    };

    const handleClickDelete = (e) => {
        e.stopPropagation(); // 부모 div의 handleAreaClick 방지
        if (window.confirm('댓글을 삭제하시겠습니까?')) {
            onDeleteClick(comment.id);
        }
    };

    return (
        <div className="comment-item">
            <div
                className={`comment-main ${isReplying ? 'active' : ''}`}
                onClick={handleAreaClick}
                style={{ cursor: currentUser ? 'pointer' : 'default' }}
            >
                <div className="comment-header">
                    <span className="comment-author">{comment.nickName}</span>
                    <div className="comment-header-right-area">
                        <span className="comment-date">
                            {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        {currentUser?.nickName === comment.nickName && !comment.deletedAt && (
                            <div className="comment-buttons">
                                <button onClick={handleClickEdit}>수정</button>
                                <button onClick={handleClickDelete}>삭제</button>
                            </div>
                        )}
                    </div>
                </div>
                <div className="comment-content">
                    {comment.deletedAt ? (
                        <span className="deleted-text">삭제된 댓글입니다.</span>
                    ) : isEditing ? (
                        <div className="edit-input-wrapper" onClick={(e) => e.stopPropagation()}>
                            <textarea
                                autoFocus
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="edit-textarea"
                            />
                            <div className="edit-actions">
                                <button onClick={() => setIsEditing(false)}>취소</button>
                                <button onClick={handleEditSubmit}>저장</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {parentAuthor && <span className="mention-tag">@{parentAuthor} </span>}
                            {comment.content}
                        </>
                    )}
                </div>
            </div>

            {isReplying && (
                <div className="reply-input-wrapper" onClick={(e) => e.stopPropagation()}>
                    <textarea
                        autoFocus
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`${comment.nickName} 님에게 답글 남기기`}
                    />
                    <div className="reply-footer">
                        <span
                            className={`char-count ${replyContent.length > MAX_LENGTH ? 'limit' : ''}`}
                        >
                            {replyContent.length} / {MAX_LENGTH}
                        </span>
                        <div className="reply-actions">
                            <button className="cancel-btn" onClick={() => setActiveReplyId(null)}>
                                취소
                            </button>
                            <button
                                className="submit-btn"
                                onClick={handleSubmit}
                                disabled={!replyContent.trim() || replyContent.length > MAX_LENGTH}
                            >
                                등록
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {comment.children && comment.children.length > 0 && (
                <div className="comment-replies">
                    {comment.children.map((child) => (
                        <CommentItem
                            key={child.id}
                            comment={child}
                            onReplySubmit={onReplySubmit}
                            currentUser={currentUser}
                            parentAuthor={comment.nickName}
                            activeReplyId={activeReplyId}
                            setActiveReplyId={setActiveReplyId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentItem;
