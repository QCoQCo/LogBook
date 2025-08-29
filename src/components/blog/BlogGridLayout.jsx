import { useState } from 'react';
import ReactGridLayout from 'react-grid-layout';
import { useLogBook } from '../../context/LogBookContext';
import BlogLayoutItem from './BlogLayoutItem';

const BlogGridLayout = ({ enableModal }) => {
    const initialLayout = [];

    const [layout, setLayout] = useState(initialLayout);
    const [newItemCounter, setNewItemCounter] = useState(0);

    const { draggingItem, setElements } = useLogBook();

    const handleClickDelete = (i) => {
        setLayout((prev) => prev.filter((item) => item.i !== i));
    };

    const onLayoutChange = (newLayout) => {
        setLayout(newLayout);
    };

    const onDrop = (currentLayout, droppedItemProps, e) => {
        // droppedItemProps에서 드롭된 아이템의 정보를 가져옵니다.
        const droppedItemData = draggingItem;
        const { x, y } = droppedItemProps;

        const isOverlap = layout.some((item) => {
            return item.x <= x && item.x + (item.w - 1) >= x && item.y === y;
        });

        const newId = `${droppedItemData.className}-${newItemCounter}`;

        const newItem = {
            i: newId,
            x: x,
            y: y,
            w: draggingItem.w,
            h: draggingItem.h,
            content: null,
        };

        if (isOverlap) {
            const newLayout = layout.map((item) =>
                item.x <= x && item.x + (item.w - 1) >= x && item.y >= y
                    ? { ...item, y: item.y + 1 }
                    : item
            );
            setLayout([...newLayout, newItem]);
            setElements((prev) => [...prev, { i: newId, content: null }]);
        } else {
            setLayout((prevLayout) => [...prevLayout, newItem]);
            setElements((prev) => [...prev, { i: newId, content: null }]);
        }

        setNewItemCounter((prevCounter) => prevCounter + 1);
    };

    const renderGridItems = () => {
        return layout.map((item) => {
            if (item.i !== '__dropping-elem__') {
                return (
                    <div key={item.i}>
                        <BlogLayoutItem
                            item={item}
                            handleClickDelete={handleClickDelete}
                            enableModal={enableModal}
                        />
                    </div>
                );
            } else {
                return;
            }
        });
    };

    return (
        <div className='blog-area'>
            <ReactGridLayout
                layout={layout}
                cols={5}
                rowHeight={170}
                width={900}
                onDrop={onDrop}
                isDroppable={true}
                isDraggable={false}
                droppingItem={{
                    i: '__dropping-elem__',
                    w: draggingItem ? draggingItem.w : 1,
                    h: draggingItem ? draggingItem.h : 1,
                }}
                compactType={'vertical'}
                onLayoutChange={onLayoutChange}
            >
                {renderGridItems()}
            </ReactGridLayout>
        </div>
    );
};

export default BlogGridLayout;
