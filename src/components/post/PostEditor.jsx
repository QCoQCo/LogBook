import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useLogBook } from '../../context/LogBookContext';
import PostToolBar from './PostToolbar';

const PostEditor = ({}) => {
    const { markdown, setMarkdown, postTitle, setPostTitle } = useLogBook();

    const navigate = useNavigate();

    const [showToolTip, setShowToolTip] = useState(false);
    const [hideTitle, setHideTitle] = useState(false);
    const [hideTags, setHideTags] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [postTags, setPostTags] = useState([]);

    const tagInputRef = useRef(null);
    const markdownRef = useRef(null);

    const handleFocusBlurTagInput = () => {
        if (!hideTags) {
            setShowToolTip((prev) => !prev);
        }
    };

    const handleChangeTagInput = (e) => {
        const inputText = e.target.value;

        if (inputText.charAt(inputText.length - 1) !== ',') {
            setTagInput(inputText);
        }
    };

    const handleChangeTitleInput = (e) => {
        setPostTitle(e.target.value);
    };

    const handleChangeTextarea = (e) => {
        setMarkdown(e.target.value);
    };

    const handelScrollTextarea = () => {
        if (markdownRef.current.scrollHeight > 600 && markdownRef.current.scrollTop > 0) {
            setHideTitle(true);
            setHideTags(true);
            setShowToolTip(false);
        } else {
            setHideTitle(false);
            setHideTags(false);
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

    const handleClickCancelBtn = () => {
        navigate(-1);
    };

    const handleClickH1Btn = () => insertMarkdown('# ');
    const handleClickH2Btn = () => insertMarkdown('## ');
    const handleClickH3Btn = () => insertMarkdown('### ');
    const handleClickBoldBtn = () => insertMarkdown('**', '**');
    const handleClickItalicBtn = () => insertMarkdown('*', '*');
    const handleClickLineBtn = () => insertMarkdown('~~', '~~');
    const handleClickQuoteBtn = () => insertMarkdown('>');

    const insertMarkdown = (prefix, suffix = '') => {
        const textarea = markdownRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentContent = textarea.value;
        const selectedText = currentContent.substring(start, end);

        let newContent;
        let newCursorPosition;
        let newCursorEnd;

        // Handle line-based markdown like H1, H2
        if (prefix.includes('#') || prefix.includes('-') || prefix.includes('>')) {
            const textBeforeCursor = currentContent.substring(0, start);
            const lastLineBreakIndex = textBeforeCursor.lastIndexOf('\n');
            const lineStartIndex = lastLineBreakIndex === -1 ? 0 : lastLineBreakIndex + 1;
            const lineContent = currentContent.substring(lineStartIndex, start);

            if (lineContent.startsWith(prefix)) {
                newContent =
                    currentContent.substring(0, lineStartIndex) +
                    currentContent.substring(lineStartIndex + prefix.length);
                newCursorPosition = start - prefix.length;
            } else {
                newContent =
                    currentContent.substring(0, lineStartIndex) +
                    prefix +
                    currentContent.substring(lineStartIndex);
                newCursorPosition = start + prefix.length;
            }
        } else {
            // Handle inline markdown like bold and italic
            if (start !== end) {
                // If text is selected, wrap it with prefix and suffix
                newContent =
                    currentContent.substring(0, start) +
                    prefix +
                    selectedText +
                    suffix +
                    currentContent.substring(end);
                newCursorPosition = start + prefix.length + selectedText.length + suffix.length;
            } else {
                // If no text is selected, insert prefix and suffix and place cursor in the middle
                newContent =
                    currentContent.substring(0, start) +
                    prefix +
                    '텍스트' +
                    suffix +
                    currentContent.substring(end);
                newCursorPosition = start + prefix.length;
                newCursorEnd = start + prefix.length + 3;
            }
        }

        setMarkdown(newContent);

        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = newCursorPosition;
            if (prefix.includes('#') || prefix.includes('-') || prefix.includes('>')) {
                textarea.selectionEnd = newCursorPosition;
            } else {
                if (start !== end) {
                    textarea.selectionEnd = newCursorPosition;
                } else {
                    textarea.selectionEnd = newCursorEnd;
                }
            }
        }, 200);
    };

    return (
        <div className='post-editor'>
            <div className={hideTitle ? 'post-title-area hidden-title' : 'post-title-area'}>
                <input
                    type='text'
                    className='post-title-input'
                    value={postTitle}
                    onChange={handleChangeTitleInput}
                    placeholder='제목을 입력해 주세요'
                />
            </div>
            <div className={hideTags ? 'post-tags-area hidden-tags' : 'post-tags-area'}>
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
                    onFocus={handleFocusBlurTagInput}
                    onBlur={handleFocusBlurTagInput}
                    placeholder='태그를 입력해 주세요'
                />
                <i className={showToolTip ? '' : 'tooltip-hidden'}>
                    <p>쉼표 혹은 엔터를 입력하여 태그를 등록 할 수 있습니다.</p>
                    <p>등록된 태그를 클릭하면 삭제됩니다.</p>
                </i>
            </div>
            <PostToolBar
                hideTitle={hideTitle}
                onClickFunctions={[
                    handleClickH1Btn,
                    handleClickH2Btn,
                    handleClickH3Btn,
                    () => {},
                    handleClickBoldBtn,
                    handleClickItalicBtn,
                    handleClickLineBtn,
                    () => {},
                    handleClickQuoteBtn,
                ]}
            />
            <textarea
                className={
                    hideTitle ? 'markdown-textarea markdown-top-position' : 'markdown-textarea'
                }
                value={markdown}
                ref={markdownRef}
                onChange={handleChangeTextarea}
                onScroll={handelScrollTextarea}
                placeholder='여기에 게시글 내용을 작성해 주세요'
            />
            <div className='post-editor-btns'>
                <button className='post-save-btn'>저 장</button>
                <button className='post-cancel-btn' onClick={handleClickCancelBtn}>
                    취 소
                </button>
            </div>
        </div>
    );
};

export default PostEditor;
