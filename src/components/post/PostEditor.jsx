import { useState, useRef } from 'react';

const PostEditor = ({ markdown, postTitle, handleMarkdownChange, handleTitleChange }) => {
    const [showToolTip, setShowToolTip] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [postTags, setPostTags] = useState([]);

    const tagInputRef = useRef();

    const handleFocusTagInput = () => {
        setShowToolTip(true);
    };

    const handleBlurTagInput = () => {
        setShowToolTip(false);
    };

    const handleChangeTagInput = (e) => {
        const inputText = e.target.value;

        if (inputText.charAt(inputText.length - 1) !== ',') {
            setTagInput(inputText);
        }
    };

    const handleKeyDown = (e) => {
        const trimmedTagInputText = e.target.value.trim();

        if (e.key === 'Enter' || e.key === ',') {
            if (trimmedTagInputText && !postTags.includes(trimmedTagInputText)) {
                setPostTags((prev) => [...prev, e.target.value.trim()]);
            }
            setTagInput('');
        }
    };

    const handleClickTagBtn = (tag) => {
        setPostTags((prev) => prev.filter((item) => item !== tag));
    };

    return (
        <div className='post-editor'>
            <div className='post-title-area'>
                <input
                    type='text'
                    className='post-title-input'
                    value={postTitle}
                    onChange={handleTitleChange}
                    placeholder='제목을 입력해 주세요'
                />
            </div>
            <div className='post-tags-area'>
                {postTags.map((item, i) => (
                    <div className='tag-item' key={i}>
                        <button
                            className='tag-button'
                            onClick={() => {
                                handleClickTagBtn(item);
                            }}
                        >
                            {item}
                        </button>
                    </div>
                ))}
                <input
                    type='text'
                    value={tagInput}
                    ref={tagInputRef}
                    className='post-tag-input'
                    onChange={handleChangeTagInput}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocusTagInput}
                    onBlur={handleBlurTagInput}
                    placeholder='태그를 입력해 주세요'
                />
                <i className={showToolTip ? '' : 'tooltip-hidden'}>
                    <p>쉼표 혹은 엔터를 입력하여 태그를 등록 할 수 있습니다.</p>
                    <p>등록된 태그를 클릭하면 삭제됩니다.</p>
                </i>
            </div>
            <textarea
                className='markdown-textarea'
                value={markdown}
                onChange={handleMarkdownChange}
                placeholder='여기에 게시글 내용을 작성해 주세요'
            />
        </div>
    );
};

export default PostEditor;
