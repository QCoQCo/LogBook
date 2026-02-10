import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useBlog } from '../../context';
import { getCurrentUserId } from '../../utils/auth';

import './BlogElementModal.scss';
import BlogModalPostListItem from './BlogModalPostListItem';

const BlogElementModal = ({ item, isBlogEditing, releaseModal }) => {
    const { elements, setElements } = useBlog();
    const currentContent = item ? elements.find((element) => element.i === item.i)?.content : '';

    const [modalContent, setModalContent] = useState(currentContent ? currentContent : '');
    const [posts, setPosts] = useState([]); // post 아이템 등록을 위한 리스트 로딩
    const [page, setPage] = useState(0); // post 아이템 페이징
    const [searchKeyword, setSearchKeyword] = useState(''); // 게시글 검색어
    const [loading, setLoading] = useState(false); // post 로딩 완료 정보
    const [hasMore, setHasMore] = useState(true); // 추가 로딩을 할 게시물이 있는지 여부를 확인
    const [postThumbnail, setPostThumbnail] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null); // 선택한 게시글 정보 state

    // 현재 로그인한 유저 ID를 저장
    // - state로 두면 불필요한 리렌더 발생
    // - fetch 함수에서 항상 최신 값을 참조하기 위해 ref 사용
    const userIdRef = useRef(null);

    // title / link / image 타입에서 input 자동 포커싱용
    const inputRef = useRef();

    // post 타입에서 input 자동 포커싱 용
    const postInputRef = useRef();

    // 내용이 비어 있을 때 보여주는 경고 문구 DOM 제어용 (state 대신 display 제어)
    const alertRef = useRef();

    // 스크롤 컨테이너
    // - IntersectionObserver root
    // - scrollTop 유지 / 제어 대상
    const postListRef = useRef(null);

    // 무한 스크롤 트리거용 sentinel
    // - 화면 하단 감지 대상
    const loadMoreRef = useRef(null);

    // IntersectionObserver 콜백 안에서 최신 loading 상태를 참조하기 위한 ref
    // (observer는 최초 렌더 시점의 state를 기억하기 때문)
    const loadingRef = useRef(false);

    // IntersectionObserver 콜백 안에서 최신 hasMore 상태를 참조하기 위한 ref
    const hasMoreRef = useRef(true);

    const type = item?.i.split('-')[0];

    // 컴포넌트 마운트 시 현재 유저 ID를 ref에 저장
    // 이후 fetch 시 항상 동일한 ID 사용
    // 최초 1회만 실행
    useEffect(() => {
        userIdRef.current = getCurrentUserId();
    }, []);

    // IntersectionObserver 콜백에서 최신 loading 상태를 참조하기 위해 ref에 동기화
    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    // 더 불러올 데이터가 있는지 여부를 observer 콜백에서 안전하게 참조하기 위한 ref
    useEffect(() => {
        hasMoreRef.current = hasMore;
    }, [hasMore]);

    useEffect(() => {
        const getPostThumbnailFromContent = (content) => {
            if (!content) return null;

            const match = content.match(/!\[.*?\]\((https?:\/\/[^\)]+)\)/);
            return match ? match[1] : null;
        };

        if (selectedPost) {
            setPostThumbnail(
                getPostThumbnailFromContent(selectedPost.content) || '/img/logBook_logo.png',
            );
        }
    }, [selectedPost]);

    // post list를 fetch 하기 위한 함수
    const fetchUserPosts = async (userId, page = 0, size = 20) => {
        try {
            const res = await axios.get(`/api/posts/lists/${userId}?page=${page}&size=${size}`);

            return res.data;
        } catch (error) {
            throw new Error('게시글 조회 실패');
        }
    };

    // 더 불러올 게시물이 있는지 확인 후 추가 로딩을 시행, posts state에 추가
    const loadPosts = async () => {
        if (!hasMore || loading) return;

        try {
            setLoading(true);
            const data = await fetchUserPosts(userIdRef.current, page);

            if (data.length === 0) {
                setHasMore(false);
                return;
            }

            setPosts((prev) => [...prev, ...data]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isBlogEditing || type !== 'post') return;

        const userId = getCurrentUserId();
        if (!userId) return;

        loadPosts();
    }, [page, isBlogEditing, type]);

    useEffect(() => {
        if (!isBlogEditing) return;
        if (type !== 'post') return;
        if (posts.length === 0) return;
        if (!loadMoreRef.current || !postListRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current) {
                    setPage((prev) => prev + 1);
                }
            },
            {
                root: postListRef.current,
                threshold: 0.1,
            },
        );

        observer.observe(loadMoreRef.current);

        return () => observer.disconnect();
    }, [posts.length, isBlogEditing, type]);

    useEffect(() => {
        if (isBlogEditing && ['title', 'link', 'image'].includes(type)) {
            inputRef.current.focus();
        }

        if (isBlogEditing && type === 'post') {
            postInputRef.current.focus();
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
        if (type !== 'post') {
            if (!modalContent.trim()) {
                alertRef.current.style.display = 'block';
                inputRef.current.focus();
                return;
            }
        }

        if (type === 'link') {
            setElements((prev) =>
                prev.map((element) =>
                    element.i === item.i
                        ? {
                              ...element,
                              content: modalContent,
                              meta: {
                                  title: null,
                                  thumbnail: null,
                                  status: 'loading', // loading | done | error
                              },
                          }
                        : element,
                ),
            );
        } else if (type === 'post') {
            setElements((prev) =>
                prev.map((element) =>
                    element.i === item.i
                        ? {
                              ...element,
                              content: modalContent,
                              meta: {
                                  thumbnail: postThumbnail,
                              },
                          }
                        : element,
                ),
            );
        } else {
            setElements((prev) =>
                prev.map((element) =>
                    element.i === item.i ? { ...element, content: modalContent } : element,
                ),
            );
        }
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

    const { title, placeholder } = modalData[type] || {};

    const filteredPosts = posts.filter((post) => {
        if (!searchKeyword.trim()) return true;

        const keyword = searchKeyword.toLowerCase();

        return (
            post.title?.toLowerCase().includes(keyword) ||
            post.content?.toLowerCase().includes(keyword)
        );
    });

    return isBlogEditing ? (
        <div
            id="BlogElementModal"
            className={type === 'post' ? 'is-post-modal' : ''}
            onClick={handleModalClick}
        >
            <div className="modal-top">
                <img className="modal-icon" src={`/img/icon-${type}.png`} alt="모달 아이콘" />
                <button className="close-modal-btn" onClick={releaseModal}>
                    모달 닫기
                </button>
            </div>
            <div className="modal-inner">
                {type === 'post' ? (
                    <input
                        className="post-search-input"
                        type="text"
                        ref={postInputRef}
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="게시글 검색어를 입력해주세요"
                    />
                ) : (
                    <h1>{title}</h1>
                )}
                {/* post 타입일 때 */}
                {type === 'post' && (
                    <div className="post-list-area" ref={postListRef}>
                        {!loading && posts.length === 0 && (
                            <p className="post-empty">내가 작성한 게시글이 없습니다.</p>
                        )}

                        {!loading && posts.length > 0 && filteredPosts.length === 0 && (
                            <p className="post-empty">검색어를 포함하는 게시글이 없습니다.</p>
                        )}

                        {filteredPosts.map((post) => (
                            <BlogModalPostListItem
                                key={post.postId}
                                post={post}
                                isSelected={selectedPost?.postId === post.postId}
                                onSelect={() => {
                                    setSelectedPost(post);
                                    setModalContent(post);
                                }}
                            />
                        ))}

                        {loading && (
                            <div className="post-loading">
                                <div className="post-loading-animation" />
                            </div>
                        )}

                        {!hasMore && filteredPosts.length > 0 && (
                            <div className="post-end">
                                <p>모든 게시글을 불러왔어요 👋</p>
                            </div>
                        )}

                        {/* sentinel */}
                        {posts.length > 0 && hasMore && (
                            <div
                                className="sentinel"
                                ref={loadMoreRef}
                                style={{ height: '20px', marginTop: '8px' }}
                            />
                        )}
                    </div>
                )}
                {/* 이외 타입들 */}
                {type !== 'post' && ['title', 'link', 'image'].includes(type) && (
                    <div className="modal-content-area">
                        <input
                            className={`input-${type}-element`}
                            type="text"
                            value={modalContent}
                            onChange={handleChangeInput}
                            ref={inputRef}
                            placeholder={placeholder}
                        />
                        <p className="empty-content-alert" ref={alertRef}>
                            내용을 입력해 주세요
                        </p>
                    </div>
                )}
                <ModalBtnArea
                    handleClickConfirm={handleClickConfirm}
                    handleClickCancel={handleClickCancel}
                />
            </div>
        </div>
    ) : (
        <div className="blog-image-modal">
            <img src={currentContent} alt="이미지 크게보기" />
        </div>
    );
};

const ModalBtnArea = ({ handleClickConfirm, handleClickCancel }) => (
    <div className="modal-btn-area">
        <button className="btn-confirm" onClick={handleClickConfirm}>
            확인
        </button>
        <button className="btn-cancel" onClick={handleClickCancel}>
            취소
        </button>
    </div>
);

export default BlogElementModal;
