import { Link } from 'react-router-dom';
import { useLogBook } from '../../context/LogBookContext';

const GridItemTop = ({ item, type, handleClickDelete }) => {
    const { setElements, isBlogEditting } = useLogBook();

    return (
        <div className='grid-item-top'>
            {
                <div className='grid-item-text'>
                    <img src={`/img/icon-${type}.png`} alt='' />
                </div>
            }
            {isBlogEditting && (
                <button
                    className='grid-item-delete'
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

const GridContent = ({ type, content }) => {
    const { isBlogEditting } = useLogBook();

    switch (type) {
        case 'image':
            return content ? (
                <img src={`https://${content.replace(/https?:\/\//, '')}`} alt='' />
            ) : (
                <p className='default-text'>
                    {isBlogEditting ? '사진을 첨부하기 위해 클릭' : '빈 블럭입니다'}
                </p>
            );
        case 'link':
            return content ? (
                <Link to={`https://${content.replace(/https?:\/\//, '')}`}>{content}</Link>
            ) : (
                <p className='default-text'>
                    {isBlogEditting ? '내용을 입력하기 위해 클릭' : '빈 블럭입니다'}
                </p>
            );
        default:
            return content ? (
                content
            ) : (
                <p className='default-text'>
                    {isBlogEditting ? '내용을 입력하기 위해 클릭' : '빈 블럭입니다'}
                </p>
            );
    }
};

const BlogLayoutItem = ({ item, handleClickDelete, enableModal }) => {
    const { setClickedItem, elements } = useLogBook();
    const itemType = item.i.split('-')[0];
    const itemContent = elements.find((element) => element.i === item.i)?.content;
    const { isBlogEditting } = useLogBook();

    return (
        <div className={isBlogEditting ? `${item.i} is-editting` : `${item.i}`}>
            <GridItemTop item={item} type={itemType} handleClickDelete={handleClickDelete} />
            <div
                className={`grid-${itemType}-content`}
                onClick={() => {
                    if (isBlogEditting) {
                        setClickedItem(item);
                        enableModal();
                    } else if (itemType === 'image') {
                    }
                }}
            >
                <GridContent type={itemType} content={itemContent} />
            </div>
        </div>
    );
};

export default BlogLayoutItem;
