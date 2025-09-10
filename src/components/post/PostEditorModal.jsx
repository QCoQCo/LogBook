import { forwardRef } from 'react';

const PostEditorModal = forwardRef(
    (
        {
            type,
            position,
            handleChangeLinkInput,
            handleChangeImageAltInput,
            handleChangeImageSrcInput,
            handleChangeOption,
        },
        modalRef
    ) => {
        return (
            <div
                className='post-editor-modal'
                ref={modalRef}
                style={{ top: position.top, left: position.left }}
            >
                {type === 'link' ? (
                    <PostEditorModalLink />
                ) : type === 'image' ? (
                    <PostEditorModalImage />
                ) : (
                    <PostEditorModalCode />
                )}
                <button>확 인</button>
            </div>
        );
    }
);

const PostEditorModalLink = () => {
    return <p>링크</p>;
};

const PostEditorModalImage = () => {
    return <p>이미지</p>;
};

const PostEditorModalCode = () => {
    return <p>코드</p>;
};

export default PostEditorModal;
