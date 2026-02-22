import apiClient from '../../utils/apiClient';
import { useEffect, useRef, useReducer } from 'react';
import { useBlog } from '../../context';
import { modalReducer, initialModalState } from './modalReducer';

import './BlogElementModal.scss';
import PostListArea from './PostListArea';
import ImageInputArea from './ImageInputArea';
import { getCurrentUserId } from '../../utils/auth';
import MapInputArea from './MapInputArea';

const BlogElementModal = ({ item, isBlogEditing, releaseModal }) => {
    const { elements, setElements, editingSessionId } = useBlog();

    const currentContent = item ? elements.find((element) => element.i === item.i)?.content : '';

    const [state, dispatch] = useReducer(modalReducer, {
        ...initialModalState,
        modalContent: currentContent || '',
    });

    const inputRef = useRef(null);
    const postInputRef = useRef(null);
    const type = item?.i.split('-')[0];

    useEffect(() => {
        if (!state.selectedPost) return;

        const match = state.selectedPost.content?.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
        dispatch({
            type: 'SET_POST_THUMBNAIL',
            payload: match ? match[1] : '/img/logBook_logo.png',
        });
    }, [state.selectedPost]);

    useEffect(() => {
        if (isBlogEditing && ['title', 'link'].includes(type)) {
            inputRef.current?.focus();
        }
        if (isBlogEditing && type === 'post') {
            postInputRef.current?.focus();
        }

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                releaseModal();
            } else if (e.key === 'Enter' && isBlogEditing) {
                handleClickConfirm();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isBlogEditing, type, state.modalContent]);

    const handleClickConfirm = async () => {
        if (['title', 'link', 'map'].includes(type) && !state.modalContent?.toString().trim()) {
            dispatch({ type: 'SET_EMPTY_ERROR' });
            if (type !== 'image' && type !== 'map') {
                inputRef.current?.focus();
            }
            return;
        }

        let finalContent = state.modalContent;
        let meta = null;

        if (type === 'link') {
            meta = { title: null, thumbnail: null, status: 'loading' };
        } else if (type === 'post') {
            meta = { thumbnail: state.postThumbnail };
        } else if (type === 'image') {
            if (!state.imageFile) return;
            try {
                const userId = getCurrentUserId();
                const formData = new FormData();
                formData.append('file', state.imageFile);
                formData.append('editId', editingSessionId);
                const res = await apiClient.post(`/img/blogItems/${userId}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                finalContent = res.data;
                meta = { tempSrc: true };
            } catch (error) {
                alert('이미지 업로드에 실패했습니다.');
                return;
            }
        }

        setElements((prev) =>
            prev.map((el) =>
                el.i === item.i ? { ...el, content: finalContent, ...(meta && { meta }) } : el,
            ),
        );

        dispatch({ type: 'RESET' });
        releaseModal();
    };

    const handleClickCancel = () => {
        dispatch({ type: 'RESET' });
        releaseModal();
    };

    // 보기 모드 분기 (수정 중이 아닐 때)
    if (!isBlogEditing) {
        return (
            <div className="blog-image-modal">
                <img src={currentContent} alt="이미지 크게보기" />
            </div>
        );
    }

    // 편집 모드 (기존 UI)
    const modalData = {
        title: { title: '제목 블럭의 내용을 입력해 주세요', placeholder: '제목을 입력하세요' },
        post: {
            title: '포스트 블럭의 내용을 입력해 주세요',
            placeholder: '포스트 내용을 입력하세요',
        },
        link: {
            title: '블럭에 추가하시려는 링크를 입력해 주세요',
            placeholder: 'https://example.com',
        },
        image: { title: '추가하려는 이미지를 첨부해 주세요', placeholder: '' },
        map: { title: '지도를 첨부해 주세요', placeholder: '' },
    };
    const { title, placeholder } = modalData[type] || {};

    return (
        <div
            id="BlogElementModal"
            className={`is-${type}-modal`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="modal-top">
                <img className="modal-icon" src={`/img/icon-${type}.png`} alt="아이콘" />
                <button className="close-modal-btn" onClick={handleClickCancel}>
                    모달 닫기
                </button>
            </div>
            <div className="modal-inner">
                {type === 'post' ? (
                    <input
                        className="post-search-input"
                        type="text"
                        ref={postInputRef}
                        value={state.searchKeyword}
                        onChange={(e) =>
                            dispatch({ type: 'SET_SEARCH_KEYWORD', payload: e.target.value })
                        }
                        placeholder="게시글 검색어를 입력해주세요"
                    />
                ) : (
                    type !== 'map' && <h1>{title}</h1>
                )}

                {type === 'post' && <PostListArea type={type} state={state} dispatch={dispatch} />}
                {type === 'image' && (
                    <ImageInputArea
                        type={type}
                        placeholder={placeholder}
                        modalContent={state.modalContent}
                        isEmptyError={state.isEmptyError}
                        dispatch={dispatch}
                    />
                )}
                {type === 'map' && (
                    <MapInputArea dispatch={dispatch} currentContent={state.modalContent} />
                )}

                {['title', 'link'].includes(type) && (
                    <div className="modal-content-area">
                        <input
                            className={`input-${type}-element`}
                            type="text"
                            value={state.modalContent}
                            onChange={(e) =>
                                dispatch({ type: 'SET_CONTENT', payload: e.target.value })
                            }
                            ref={inputRef}
                            placeholder={placeholder}
                        />
                        {state.isEmptyError && (
                            <p className="empty-content-alert">내용을 입력해 주세요</p>
                        )}
                    </div>
                )}

                <div className="modal-btn-area">
                    <button className="btn-confirm" onClick={handleClickConfirm}>
                        확인
                    </button>
                    <button className="btn-cancel" onClick={handleClickCancel}>
                        취소
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlogElementModal;
