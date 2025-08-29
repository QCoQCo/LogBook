import { forwardRef } from 'react';

const BlogElementModal = forwardRef(({ item, handleClickConfirm, handleClickCancel }, ref) => {
    const type = item ? item.i : 'NULL';
    const isTitle = type.startsWith('title');
    const isPost = type.startsWith('post');
    const isLink = type.startsWith('link');
    const isImage = type.startsWith('image');
    const isMap = type.startsWith('map');

    if (isTitle) {
        return (
            <div id='BlogElementModal' ref={ref}>
                <div>타이틀</div>
                <ModalBtnArea
                    handleClickConfirm={handleClickConfirm}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        );
    } else if (isPost) {
        return (
            <div id='BlogElementModal' ref={ref}>
                <div>포스트</div>
                <ModalBtnArea
                    handleClickConfirm={handleClickConfirm}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        );
    } else if (isLink) {
        return (
            <div id='BlogElementModal' ref={ref}>
                <div>링크</div>
                <ModalBtnArea
                    handleClickConfirm={handleClickConfirm}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        );
    } else if (isImage) {
        return (
            <div id='BlogElementModal' ref={ref}>
                <div>이미지</div>
                <ModalBtnArea
                    handleClickConfirm={handleClickConfirm}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        );
    } else if (isMap) {
        return (
            <div id='BlogElementModal' ref={ref}>
                <div>지도</div>
                <ModalBtnArea
                    handleClickConfirm={handleClickConfirm}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        );
    }
});

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
