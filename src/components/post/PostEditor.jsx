import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { usePost } from '../../context';
import PostToolBar from './PostToolbar';
import PostEditorModal from './PostEditorModal';

const PostEditor = ({ isEdit }) => {
    // useContext
    const { markdown, setMarkdown, postTitle, setPostTitle, postTags, setPostTags, posts } =
        usePost();

    // useNavigate
    const navigate = useNavigate();

    // params
    const [searchParam] = useSearchParams();
    const postId = isEdit ? parseInt(searchParam.get('postId')) : null;

    // fetch post Data & set
    useEffect(() => {
        if (isEdit && posts) {
            const currentPost = posts.find((post) => post.postId === postId);

            if (currentPost) {
                setPostTitle(currentPost.title);
                setPostTags(currentPost.tags);
                setMarkdown(currentPost.content);
            }
        }
    }, [isEdit, postId, posts]);

    // states management
    const [showToolTip, setShowToolTip] = useState(false);
    const [hideTitle, setHideTitle] = useState(false);
    const [hideTags, setHideTags] = useState(false);
    const [tagInput, setTagInput] = useState('');

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalIsOverflow, setModalIsOverflow] = useState('none');
    const [modalType, setModalType] = useState('link');
    const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

    // refs management
    const tagInputRef = useRef(null);
    const markdownRef = useRef(null);
    const mirrorRef = useRef(null);
    const scrollTopRef = useRef(0);

    // event handlers
    const handleClickToolBar = (e) => {
        switch (e.target.className) {
            case 'h1-btn':
                toolBarFunction(() => {
                    insertMarkdown('# ');
                });
                break;
            case 'h2-btn':
                toolBarFunction(() => {
                    insertMarkdown('## ');
                });
                break;
            case 'h3-btn':
                toolBarFunction(() => {
                    insertMarkdown('## ');
                });
                break;
            case 'bold-btn':
                toolBarFunction(() => {
                    insertMarkdown('**', '**');
                });
                break;
            case 'italic-btn':
                toolBarFunction(() => {
                    insertMarkdown('*', '*');
                });
                break;
            case 'line-through-btn':
                toolBarFunction(() => {
                    insertMarkdown('~~', '~~');
                });
                break;
            case 'quote-btn':
                toolBarFunction(() => {
                    insertMarkdown('> ');
                });
                break;
            case 'link-btn':
                toolBarFunction(() => {
                    setModalType('link');
                    getCursorPosition();
                });
                break;
            case 'image-btn':
                toolBarFunction(() => {
                    setModalType('image');
                    getCursorPosition();
                });
                break;
            case 'code-btn':
                toolBarFunction(() => {
                    setModalType('code');
                    getCursorPosition();
                });
                break;
            default:
                return;
        }
    };

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
        const scrollTop = markdownRef.current.scrollTop;
        const scrollHeight = markdownRef.current.scrollHeight;

        if (scrollHeight > 1200 && scrollTop > 0 && !hideTitle) {
            setHideTitle(true);
            setHideTags(true);
            setShowToolTip(false);
        } else if (scrollTop === 0 && hideTitle) {
            setHideTitle(false);
            setHideTags(false);
        }
        scrollTopRef.current = scrollTop;
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

    const handleClickConfirm = (value, type) => {
        if (type === 'link') {
            toolBarFunction(() => {
                insertMarkdown('[', `](${value})`);
            });
        } else if (type === 'image') {
            toolBarFunction(() => {
                insertMarkdown('![', `](${value})`);
            });
        } else if (type === 'code') {
            toolBarFunction(() => {
                insertMarkdown('```', '```', value);
            });
        }

        setModalIsOverflow('none');
        releaseModal();
    };

    const handleClickCancelBtn = () => {
        navigate(-1);
    };

    // add prefix / suffix using markdown toolbar buttons
    const insertMarkdown = (prefix, suffix = '', codeType = '') => {
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
        } else if (prefix.includes('```')) {
            // Handle multiple lines markdown for code block
            const prefixWithCodeType = prefix + codeType + '\n';

            if (start !== end) {
                // If text is selected, wrap it with prefix and suffix
                newContent =
                    currentContent.substring(0, start) +
                    prefixWithCodeType +
                    selectedText +
                    '\n' +
                    suffix +
                    currentContent.substring(end);
                newCursorPosition =
                    start + prefixWithCodeType.length + selectedText.length + suffix.length + 1;
            } else {
                // If no text is selected, insert prefix and suffix and place cursor in the middle
                newContent =
                    currentContent.substring(0, start) +
                    prefixWithCodeType +
                    '코드를 입력해 주세요' +
                    '\n' +
                    suffix +
                    currentContent.substring(end);
                newCursorPosition = start + prefixWithCodeType.length;
                newCursorEnd = start + prefixWithCodeType.length + 11;
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

        setTimeout(() => {
            setMarkdown(newContent);
        }, 100);

        // timeout for setting cursor position after insertion
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

    // finding cursor position for modal
    const getCursorPosition = () => {
        const scrollOffset = scrollTopRef.current;
        const textarea = markdownRef.current;
        const mirror = mirrorRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        // Get the text content before the cursor
        const textBeforeCursor = textarea.value.substring(0, start);

        // Update the mirror content to match the textarea's
        mirror.textContent = textBeforeCursor;

        // Create a temporary span to represent the cursor and measure its position
        const cursorSpan = document.createElement('span');
        cursorSpan.textContent = '|'; // A single character to measure position
        mirror.appendChild(cursorSpan);

        // Get the position of the cursor span relative to the viewport
        const cursorRect = cursorSpan.getBoundingClientRect();
        const textareaRect = textarea.getBoundingClientRect();

        // Calculate final position relative to the textarea wrapper
        const top = cursorRect.top - textareaRect.top + textarea.offsetTop - scrollOffset;
        const left = cursorRect.left - textareaRect.left + textarea.offsetLeft;

        // Clean up the mirror
        setModalPosition({ top: top, left: left });
        if (top >= textarea.clientHeight - 80) {
            setModalIsOverflow('bottom');
        } else if (top < 0) {
            setModalIsOverflow('top');
        }

        showModal();

        mirror.textContent = '';
    };

    const recoverScrollTop = () => {
        if (markdownRef.current) {
            markdownRef.current.scrollTop = scrollTopRef.current;
        }
    };

    // tool bar function layout
    const toolBarFunction = (markdownInsertion) => {
        // get current scrollTop position
        scrollTopRef.current = markdownRef.current.scrollTop;

        markdownInsertion();

        setTimeout(() => {
            recoverScrollTop();
        }, 200);
    };

    const showModal = () => {
        setModalIsOpen(true);
    };
    // console.log
    const releaseModal = () => {
        setModalIsOpen(false);
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
            <PostToolBar hideTitle={hideTitle} handleOnClick={handleClickToolBar} />
            <div className='textarea-wrapper'>
                <textarea
                    className={
                        hideTitle ? 'markdown-textarea markdown-top-position' : 'markdown-textarea'
                    }
                    value={markdown}
                    ref={markdownRef}
                    spellCheck='false'
                    onChange={handleChangeTextarea}
                    onScroll={handelScrollTextarea}
                    placeholder='여기에 게시글 내용을 작성해 주세요'
                />
                {modalIsOpen && (
                    <PostEditorModal
                        type={modalType}
                        position={modalPosition}
                        isOverflow={modalIsOverflow}
                        isOpen={modalIsOpen}
                        handleClickConfirm={handleClickConfirm}
                        releaseModal={releaseModal}
                    />
                )}
                <div className='mirror-div' ref={mirrorRef}></div>
            </div>
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
