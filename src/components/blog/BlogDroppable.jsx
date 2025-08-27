const BlogDroppable = ({ droppableItem }) => {
    return (
        <div
            className={`droppable-${droppableItem.className}-element`}
            draggable={true}
            unselectable='on'
            onDragStart={(e) => e.dataTransfer.setData('text/plain', JSON.stringify(droppableItem))}
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
