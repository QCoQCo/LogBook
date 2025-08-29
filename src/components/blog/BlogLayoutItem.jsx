import { useLogBook } from '../../context/LogBookContext';

const BlogLayoutItem = ({ item, handleClickDelete, enableModal }) => {
    const { setClickedItem } = useLogBook();

    const itemText = item.i.replace(/-/g, ' ').toUpperCase();

    return (
        <div
            className={item.i}
            onClick={(e) => {
                console.log(e.target.className);
                setClickedItem(item);
                enableModal();
            }}
        >
            <div className='grid-item-text'>{itemText}</div>
            <button
                className='grid-item-delete'
                onClick={() => {
                    handleClickDelete(item.i);
                }}
            >
                삭제
            </button>
        </div>
    );
};

export default BlogLayoutItem;
