import axios from 'axios';
import { useEffect } from 'react';
import { useBlog } from '../../context';

const GridItemTop = ({ item, type, handleClickDelete }) => {
    const { setElements, isBlogEditing } = useBlog();

    return (
        <div className="grid-item-top">
            {
                <div className="grid-item-text">
                    <img src={`/img/icon-${type}.png`} alt="" draggable={false} />
                </div>
            }
            {isBlogEditing && (
                <button
                    className="grid-item-delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        setElements((prev) => prev.filter((element) => element.i !== item.i));
                        handleClickDelete(item.i);
                    }}
                ></button>
            )}
        </div>
    );
};

const LinkGridContent = ({ element }) => {
    const { setElements, isBlogEditing } = useBlog();
    const { content, meta } = element;

    const hasThumbnail = !!meta?.thumbnail;
    const hasTitle = !!meta?.title;

    useEffect(() => {
        if (!content) return;
        if (meta?.status !== 'loading') return;

        const controller = new AbortController();

        axios
            .post('/api/links/thumbnail', { url: content }, { signal: controller.signal })
            .then((res) => {
                const data = res.data;

                setElements((prev) =>
                    prev.map((el) =>
                        el.i === element.i
                            ? {
                                  ...el,
                                  meta: {
                                      ...el.meta,
                                      thumbnail: data.thumbnail ?? null,
                                      title: data.title ?? null,
                                      status: data.thumbnail || data.title ? 'done' : 'error',
                                  },
                              }
                            : el,
                    ),
                );
            })
            .catch((err) => {
                console.log(err);
                // 요청 취소는 무시
                if (axios.isCancel(err)) return;

                setElements((prev) =>
                    prev.map((el) =>
                        el.i === element.i
                            ? {
                                  ...el,
                                  meta: {
                                      ...el.meta,
                                      thumbnail: null,
                                      title: null,
                                      status: 'error',
                                  },
                              }
                            : el,
                    ),
                );
            });

        return () => {
            controller.abort();
        };
    }, [content, meta?.status, element.i, setElements]);

    // --- render ---
    if (!content) {
        return (
            <p className="default-text">
                {isBlogEditing ? '내용을 입력하기 위해 클릭' : '빈 블럭입니다'}
            </p>
        );
    }

    if (meta?.status === 'loading') {
        return <div className="link-skeleton">로딩중…</div>;
    }

    return (
        <a
            href={content.startsWith('http') ? content : `https://${content}`}
            target="_blank"
            rel="noopener noreferrer"
            className="link-preview"
            draggable={false}
            onClick={(e) => {
                if (isBlogEditing) {
                    e.preventDefault(); // 링크 이동 차단
                }
            }}
        >
            {hasThumbnail ? (
                <img src={meta.thumbnail} alt="link thumbnail" draggable={false} />
            ) : (
                <div className="link-no-thumb">
                    <p className="no-thumb-text">미리보기 없음</p>

                    {hasTitle ? (
                        <p className="link-title">{meta.title}</p>
                    ) : (
                        <p className="link-url">{content.replace(/^https?:\/\//, '')}</p>
                    )}
                </div>
            )}
        </a>
    );
};

const GridContent = ({ type, element }) => {
    const { isBlogEditing } = useBlog();

    switch (type) {
        case 'image':
            return element.content ? (
                <img src={element.content} alt="" draggable={false} />
            ) : (
                <p className="default-text">
                    {isBlogEditing ? '사진을 첨부하기 위해 클릭' : '빈 블럭입니다'}
                </p>
            );

        case 'link':
            return <LinkGridContent element={element} />;

        default:
            return element.content ? (
                element.content
            ) : (
                <p className="default-text">
                    {isBlogEditing ? '내용을 입력하기 위해 클릭' : '빈 블럭입니다'}
                </p>
            );
    }
};

const BlogLayoutItem = ({ item, handleClickDelete, enableModal }) => {
    const { setClickedItem, elements, isBlogEditing } = useBlog();
    const element = elements.find((el) => el.i === item.i);
    const itemType = item.i.split('-')[0];

    return (
        <div className={isBlogEditing ? `${item.i} is-editting` : `${item.i}`}>
            <GridItemTop item={item} type={itemType} handleClickDelete={handleClickDelete} />
            <div
                className={`grid-${itemType}-content`}
                onClick={() => {
                    if (isBlogEditing) {
                        setClickedItem(item);
                        enableModal();
                    } else if (itemType === 'image') {
                        setClickedItem(item);
                        enableModal();
                    }
                }}
            >
                <GridContent type={itemType} element={element} />
            </div>
        </div>
    );
};

export default BlogLayoutItem;
