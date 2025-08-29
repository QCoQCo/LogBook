import { useState } from 'react';
import ReactGridLayout from 'react-grid-layout';

const BlogGridLayout = () => {
    const initialLayout = [];

    const [layout, setLayout] = useState(initialLayout);
    const [newItemCounter, setNewItemCounter] = useState(0);

    const onLayoutChange = (newLayout) => {
        setLayout(newLayout);
    };

    const onDrop = (currentLayout, droppedItemProps, e) => {
        // droppedItemProps에서 드롭된 아이템의 정보를 가져옵니다.
        const droppedItemData = e.dataTransfer.getData('text/plain');
        const droppedItemJSON = JSON.parse(droppedItemData);
        const { x, y } = droppedItemProps;

        const isOverlap = layout.some((item) => {
            return item.x <= x && item.x + (item.w - 1) >= x && item.y === y;
        });

        const newId = `${droppedItemJSON.className}-${newItemCounter}`;
        const newWidth = droppedItemJSON.className === 'title' ? 5 : 1;

        const newItem = {
            i: newId,
            x: x,
            y: y,
            w: newWidth,
            h: 1,
        };

        if (isOverlap) {
            const newLayout = layout.map((item) =>
                item.x <= x && item.x + (item.w - 1) >= x && item.y >= y
                    ? { ...item, y: item.y + 1 }
                    : item
            );
            setLayout([...newLayout, newItem]);
        } else {
            setLayout((prevLayout) => [...prevLayout, newItem]);
        }

        setNewItemCounter((prevCounter) => prevCounter + 1);
    };

    const renderGridItems = () => {
        return layout.map((item) => {
            const isNewItem = item.i.startsWith('new-item');
            const itemText = isNewItem
                ? `New Item ${item.i.split('-').pop()}`
                : item.i.replace(/-/g, ' ').toUpperCase();
            if (item.i !== '__dropping-elem__') {
                return (
                    <div className={isNewItem ? 'new-grid-item' : item.i} key={item.i}>
                        <div className='grid-item-text'>{itemText}</div>
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
                compactType={'vertical'}
                onLayoutChange={onLayoutChange}
            >
                {renderGridItems()}
            </ReactGridLayout>
        </div>
    );
};

export default BlogGridLayout;
