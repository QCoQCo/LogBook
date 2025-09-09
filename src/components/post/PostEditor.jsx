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

    const handleClickH1Btn = () => {
        const textarea = markdownRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentContent = textarea.value;

        const textBeforeCursor = currentContent.substring(0, start);
        const lastLineBreakIndex = textBeforeCursor.lastIndexOf('\n');
        const lineStartIndex = lastLineBreakIndex === -1 ? 0 : lastLineBreakIndex + 1;
        const lineContent = currentContent.substring(lineStartIndex, start);

        console.log('지금 커서', start);
        console.log('지금 커서 뒤', end);

        console.log('줄 맨 앞', lineStartIndex);
        console.log('줄 바꿈 위치', lastLineBreakIndex);

        console.log(lineContent);

        // let newContent;
        // let newCursorPosition;

        // if (lineContent.startsWith(prefix)) {
        //     // If prefix already exists, remove it
        //     newContent =
        //         currentContent.substring(0, lineStartIndex) +
        //         currentContent.substring(lineStartIndex + prefix.length);
        //     newCursorPosition = start - prefix.length;
        // } else {
        //     // Otherwise, add the prefix at the beginning of the line
        //     newContent =
        //         currentContent.substring(0, lineStartIndex) +
        //         prefix +
        //         currentContent.substring(lineStartIndex);
        //     newCursorPosition = start + prefix.length;
        // }
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
            </div>
            <i className={showToolTip ? '' : 'tooltip-hidden'}>
                <p>쉼표 혹은 엔터를 입력하여 태그를 등록 할 수 있습니다.</p>
                <p>등록된 태그를 클릭하면 삭제됩니다.</p>
            </i>
            <PostToolBar hideTitle={hideTitle} onClickFunctions={[handleClickH1Btn]} />
            <textarea
                className='markdown-textarea'
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
