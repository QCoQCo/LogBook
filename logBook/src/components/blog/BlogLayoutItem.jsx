import { useBlog } from '../../context';

import LinkGridContent from './LinkGridContent';
import PostGridContent from './PostGridContent';

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
                <GridContent type={itemType} item={item} element={element} />
            </div>
        </div>
    );
};

export default BlogLayoutItem;
