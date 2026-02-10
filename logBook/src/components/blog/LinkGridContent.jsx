import axios from 'axios';

import { useEffect } from 'react';
import { useBlog } from '../../context';

export const LinkGridContent = ({ element }) => {
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

export default LinkGridContent;
