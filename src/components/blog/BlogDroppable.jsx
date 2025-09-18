// BlogDroppable.jsx
import { useContext } from 'react';
import { useBlog } from '../../context';

const BlogDroppable = ({ droppableItem }) => {
    const { draggingItem, setDraggingItem } = useBlog();

    const handleDragStart = (e) => {
        setDraggingItem(droppableItem);
        e.dataTransfer.setData('text/plain', '');
    };

    const handleDragEnd = () => {
        setDraggingItem(null);
    };

    return (
        <div
            className={`droppable-${droppableItem.className}-element`}
            draggable={true}
            unselectable='on'
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd} // 드래그가 끝났을 때 상태를 초기화하는 이벤트 핸들러를 추가합니다.
        >
            <img
                className={`${droppableItem.className}-element-image`}
                src={droppableItem.imageSource}
                alt={droppableItem.tooltip}
            />
            <i>{droppableItem.tooltip}</i>
        </div>
    );
};

export default BlogDroppable;
