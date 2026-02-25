import { useState } from 'react';

const CommentInput = ({ onSubmit, placeholder = '댓글을 입력하세요...' }) => {
    const [content, setContent] = useState('');
    const MAX_LENGTH = 500; // 제한 설정

    const handleSubmit = () => {
        if (!content.trim()) return;
        onSubmit(null, content);
        setContent('');
    };

    return (
        <div className="comment-form">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
            />
            <div className="form-footer">
                <span className={`char-count ${content.length > MAX_LENGTH ? 'limit' : ''}`}>
                    {content.length} / {MAX_LENGTH}
                </span>
                <button onClick={handleSubmit}>등록</button>
            </div>
        </div>
    );
};

export default CommentInput;
