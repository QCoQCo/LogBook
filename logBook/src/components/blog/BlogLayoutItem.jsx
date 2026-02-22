import { useBlog } from '../../context';
import { useMemo } from 'react';

import LinkGridContent from './LinkGridContent';
import MapGridContent from './MapGridContent';
import PostGridContent from './PostGridContent';

const GridItemTop = ({ item, type, element, handleClickDelete }) => {
    const { setElements, isBlogEditing } = useBlog();

    // 상단 바에 표시할 제목(디스플레이 네임) 계산
    const displayTitle = useMemo(() => {
        if (!element.content) return null;

        if (type === 'link') {
            const data = element.meta;
            return data.title; // 링크 제목
        }
        if (type === 'post') {
            const data = element.content;
            return data.title;
        }
        if (type === 'map') {
            const data = JSON.parse(element.content);
            return data.name; // 장소명
        }
        return null;
    }, [element, type]);

    return (
        <div className="grid-item-top">
            <div className="grid-item-text">
                <img src={`/img/icon-${type}.png`} alt="" draggable={false} />
                {/* 계산된 제목이 있을 때만 p 태그 렌더링 */}
                {displayTitle && <p>{displayTitle}</p>}
            </div>

            {isBlogEditing && (
                <button
                    className="grid-item-delete"
                    onClick={(e) => {
                        e.stopPropagation();
                        setElements((prev) => prev.filter((el) => el.i !== item.i));
                        handleClickDelete(item.i);
                    }}
                ></button>
            )}
        </div>
    );
};

const GridContent = ({ type, item, element }) => {
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
        case 'post':
            return <PostGridContent item={item} element={element} />;
        case 'map':
            return <MapGridContent element={element} />;

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
            <GridItemTop
                item={item}
                type={itemType}
                element={element}
                handleClickDelete={handleClickDelete}
            />
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
                <GridContent type={itemType} item={item} element={element} />
            </div>
        </div>
    );
};

export default BlogLayoutItem;
