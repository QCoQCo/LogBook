import { useEffect, useRef, useState } from 'react';
import { useLogBook } from '../../context/LogBookContext';

const BlogElementModal = ({ item, releaseModal }) => {
    const { elements, setElements } = useLogBook();
    const currentContent = item ? elements.find((element) => element.i === item.i)?.content : '';

    const [modalContent, setModalContent] = useState(currentContent ? currentContent : '');
    const inputRef = useRef();
    const alertRef = useRef();

    useEffect(() => {
        if (['title', 'link', 'image'].includes(type)) {
            inputRef.current.focus();
        }

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                releaseModal();
            } else if (e.key === 'Enter') {
                handleClickConfirm();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [modalContent]);

    const handleModalClick = (e) => e.stopPropagation();

    const handleChangeInput = (e) => {
        setModalContent(e.target.value);
        alertRef.current.style.display = 'none';
    };

    const handleClickConfirm = () => {
        if (!modalContent.trim()) {
            alertRef.current.style.display = 'block';
            inputRef.current.focus();
            return;
        }

        setElements((prev) =>
            prev.map((element) =>
                element.i === item.i ? { ...element, content: modalContent } : element
            )
        );
        releaseModal();
    };

    const handleClickCancel = () => releaseModal();

    const modalData = {
        title: {
            title: '제목 블럭의 내용을 입력해 주세요',
            placeholder: '제목을 입력하세요',
        },
        post: {
            title: '포스트 블럭의 내용을 입력해 주세요',
            placeholder: '포스트 내용을 입력하세요',
        },
        link: {
            title: '블럭에 추가하시려는 링크를 입력해 주세요',
            placeholder: '링크를 입력하세요 (예: https://example.com)',
        },
        image: {
            title: '이미지의 링크를 입력해 주세요',
            placeholder: '이미지 URL을 입력하세요',
        },
        map: {
            title: '지도를 첨부해 주세요',
            placeholder: '지도 정보를 입력하세요',
        },
    };

    const type = item?.i.split('-')[0];
    const { title, placeholder } = modalData[type] || {};

    return (
        <div id='BlogElementModal' onClick={handleModalClick}>
            <div className='modal-top'>
                <img className='modal-icon' src={`/img/icon-${type}.png`} alt='모달 아이콘' />
                <button className='close-modal-btn' onClick={releaseModal}>
                    모달 닫기
                </button>
            </div>
            <div className='modal-inner'>
                <h1>{title}</h1>
                {['title', 'link', 'image'].includes(type) ? (
                    <div className='modal-content-area'>
                        <input
                            className={`input-${type}-element`}
                            type='text'
                            value={modalContent}
                            onChange={handleChangeInput}
                            ref={inputRef}
                            placeholder={placeholder}
                        />
                        <p className='empty-content-alert' ref={alertRef}>
                            내용을 입력해 주세요
                        </p>
                    </div>
                ) : (
                    <p>{placeholder}</p>
                )}
                <ModalBtnArea
                    handleClickConfirm={handleClickConfirm}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        </div>
    );
};

const ModalBtnArea = ({ handleClickConfirm, handleClickCancel }) => (
    <div className='modal-btn-area'>
        <button className='btn-confirm' onClick={handleClickConfirm}>
            확인
        </button>
        <button className='btn-cancel' onClick={handleClickCancel}>
            취소
        </button>
    </div>
);

export default BlogElementModal;
