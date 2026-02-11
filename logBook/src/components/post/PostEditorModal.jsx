import { useState, useEffect, useRef } from 'react';

const PostEditorModal = ({
    type,
    position,
    isOverflow,
    isOpen,
    handleClickConfirm,
    releaseModal,
}) => {
    const [link, setLink] = useState('');
    const [imageSrc, setImageSrc] = useState('');
    const [codeType, setCodeType] = useState('javascript');

    const modalRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                releaseModal();
            } else if (e.key === 'Enter') {
                handleConfirmByType();
            }
        };

        let timeoutId;
        const handleClickOutside = (e) => {
            if (isOpen && !modalRef.current.contains(e.target)) {
                releaseModal();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        if (isOpen) {
            timeoutId = setTimeout(() => {
                document.addEventListener('click', handleClickOutside);
            }, 0);
        }

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [link, imageSrc, codeType, isOpen]);

    const handleChangeLinkInput = (e) => {
        setLink(e.target.value);
    };

    const handleChangeImageSrcInput = (e) => {
        setImageSrc(e.target.value);
    };

    const handleChangeSelect = (e) => {
        setCodeType(e.target.value);
    };

    const handleConfirmByType = () => {
        switch (type) {
            case 'link':
                handleClickConfirm(link, type);
                break;
            case 'image':
                handleClickConfirm(imageSrc, type);
                break;
            case 'code':
                handleClickConfirm(codeType, type);
                break;
            default:
                return;
        }
    };

    return (
        <div
            className='post-editor-modal'
            ref={modalRef}
            style={
                isOverflow === 'bottom'
                    ? { bottom: 0, left: position.left }
                    : isOverflow === 'top'
                    ? { top: 0, left: position.left }
                    : { top: position.top, left: position.left }
            }
        >
            {type === 'link' ? (
                <PostEditorModalLink handleChangeLinkInput={handleChangeLinkInput} />
            ) : type === 'image' ? (
                <PostEditorModalImage handleChangeImageSrcInput={handleChangeImageSrcInput} />
            ) : (
                <PostEditorModalCode handleChangeSelect={handleChangeSelect} />
            )}
            <button onClick={handleConfirmByType}>확 인</button>
        </div>
    );
};

const PostEditorModalLink = ({ handleChangeLinkInput }) => {
    const linkInputRef = useRef(null);

    useEffect(() => {
        linkInputRef.current.focus();
    }, []);

    return (
        <div className='link-input-modal'>
            <p>링크 입력</p>
            <input
                type='text'
                ref={linkInputRef}
                onChange={handleChangeLinkInput}
                placeholder='링크를 입력해 주세요.'
            />
        </div>
    );
};

const PostEditorModalImage = ({ handleChangeImageSrcInput }) => {
    const imageSrcRef = useRef(null);

    useEffect(() => {
        imageSrcRef.current.focus();
    }, []);

    return (
        <div className='image-src-modal'>
            <p>이미지</p>
            <input
                type='text'
                ref={imageSrcRef}
                onChange={handleChangeImageSrcInput}
                placeholder='이미지 링크를 입력해 주세요.'
            />
        </div>
    );
};

const PostEditorModalCode = ({ codeType, handleChangeSelect }) => {
    const codeTypes = [
        { value: 'javascript', text: 'JavaScript' },
        { value: 'typescript', text: 'TypeScript' },
        { value: 'jsx', text: 'React (JSX)' },
        { value: 'tsx', text: 'React (TSX)' },
        { value: 'python', text: 'Python' },
        { value: 'java', text: 'Java' },
        { value: 'c', text: 'C' },
        { value: 'cpp', text: 'C++' },
        { value: 'csharp', text: 'C#' },
        { value: 'go', text: 'Go' },
        { value: 'ruby', text: 'Ruby' },
        { value: 'swift', text: 'Swift' },
        { value: 'kotlin', text: 'Kotlin' },
        { value: 'php', text: 'PHP' },
        { value: 'html', text: 'HTML' },
        { value: 'css', text: 'CSS' },
        { value: 'scss', text: 'SCSS' },
        { value: 'bash', text: 'Bash' },
        { value: 'sql', text: 'SQL' },
        { value: 'json', text: 'JSON' },
        { value: 'yaml', text: 'YAML' },
        { value: 'graphql', text: 'GraphQL' },
        { value: 'powershell', text: 'PowerShell' },
        { value: 'rust', text: 'Rust' },
        { value: 'scala', text: 'Scala' },
        { value: 'shell', text: 'Shell' },
        { value: 'docker', text: 'Docker' },
        { value: 'git', text: 'Git' },
        { value: 'regex', text: 'Regex' },
        { value: 'plaintext', text: 'Plain Text' },
    ];

    return (
        <div className='code-type-modal'>
            <p>코드 종류</p>
            <select name='code-type' id='code-type' value={codeType} onChange={handleChangeSelect}>
                {codeTypes.map((item) => (
                    <option value={item.value} key={item.value}>
                        {item.text}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default PostEditorModal;
