import { useRef, useState } from 'react';
import { useLogBook } from '../../context/LogBookContext';

const BlogElementModal = ({ item, dismissModal }) => {
    // item의 타입에 따른 Modal Component 선택을 위한 Boolean
    const type = item ? item.i : 'NULL';
    const isTitle = type.startsWith('title');
    const isPost = type.startsWith('post');
    const isLink = type.startsWith('link');
    const isImage = type.startsWith('image');
    const isMap = type.startsWith('map');

    // content 내용을 위한 Context
    const { elements, setElements } = useLogBook();
    const currentContent = elements.find((element) => element.i === type).content;

    const inputTitleTextRef = useRef();

    const [titleText, setTitleText] = useState(currentContent ? currentContent : '');

    const handleClickConfirm = () => {
        dismissModal();
    };

    const handleClickCancel = () => {
        dismissModal();
    };

    const handleChangeTitleText = (e) => {
        setTitleText(e.target.value);
    };

    if (isTitle) {
        return (
            <div id='BlogElementModal'>
                <h1>제목 블럭의 내용을 입력해 주세요</h1>
                <div>
                    <input
                        className='input-title-element'
                        type='text'
                        value={titleText}
                        onChange={handleChangeTitleText}
                        ref={inputTitleTextRef}
                    />
                </div>
                <ModalBtnArea
                    handleClickConfirm={() => {
                        if (!titleText.trim()) {
                            alert('내용 입력해라 임마');
                        } else {
                            setElements((prev) =>
                                prev.map((element) =>
                                    element.i === item.i
                                        ? { ...element, content: titleText }
                                        : element
                                )
                            );
                            dismissModal();
                        }
                    }}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        );
    } else if (isPost) {
        return (
            <div id='BlogElementModal'>
                <div>포스트</div>
                <ModalBtnArea
                    handleClickConfirm={handleClickConfirm}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        );
    } else if (isLink) {
        return (
            <div id='BlogElementModal'>
                <div>링크</div>
                <ModalBtnArea
                    handleClickConfirm={handleClickConfirm}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        );
    } else if (isImage) {
        return (
            <div id='BlogElementModal'>
                <div>이미지</div>
                <ModalBtnArea
                    handleClickConfirm={handleClickConfirm}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        );
    } else if (isMap) {
        return (
            <div id='BlogElementModal'>
                <div>지도</div>
                <ModalBtnArea
                    handleClickConfirm={handleClickConfirm}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        );
    }
};

const ModalBtnArea = ({ handleClickConfirm, handleClickCancel }) => {
    return (
        <div className='modal-btn-area'>
            <button className='btn-confirm' onClick={handleClickConfirm}>
                확인
            </button>
            <button className='btn-cancel' onClick={handleClickCancel}>
                취소
            </button>
        </div>
    );
};

export default BlogElementModal;
