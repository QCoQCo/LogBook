import React, { useState } from 'react';
import ReactGridLayout from 'react-grid-layout';
import './MyPage.scss';

const initialLayout = [
    { i: 'BED', x: 0, y: 0, w: 1, h: 1 },
    { i: 'dark-magician', x: 1, y: 0, w: 1, h: 1 },
    { i: 'kuriboh', x: 2, y: 0, w: 1, h: 1 },
    { i: 'spell-caster', x: 3, y: 0, w: 1, h: 1 },
    { i: 'summoned-skull', x: 0, y: 1, w: 1, h: 1 },
];

const MyPage = () => {
    const [layout, setLayout] = useState(initialLayout);
    const [newItemCounter, setNewItemCounter] = useState(0);

    const onLayoutChange = (newLayout) => {
        setLayout(newLayout);
        console.log('Layout changed:', newLayout);
    };

    const onDrop = (currentLayout, droppedItemProps) => {
        // droppedItemProps에서 드롭된 아이템의 정보를 가져옵니다.
        const { x, y } = droppedItemProps;

        const isOverlap = layout.some((item, i) => {
            return item.x <= x && item.x + (item.w - 1) >= x && item.y === y;
        });

        console.log(isOverlap);
        // 새로운 아이템 객체를 생성합니다.

        const newId = `new-item-${newItemCounter}`;

        const newItem = {
            i: newId,
            x: x,
            y: y,
            w: 1,
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
        <div id='MyPage'>
            <div className='user-info-area'>
                <div className='profile-photo'>
                    <img id='user-profile-photo' src='' alt='' />
                </div>
                <div className='user-introduction'>
                    <textarea></textarea>
                </div>
            </div>
            <div className='blog-area'>
                <div className='floating-droppables-ui'>
                    <div
                        className='droppable-element'
                        draggable={true}
                        unselectable='on'
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', '')}
                    >
                        Drag Element1
                    </div>
                    <div
                        className='droppable-element'
                        draggable={true}
                        unselectable='on'
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', '')}
                    >
                        Drag Element2
                    </div>
                    <div
                        className='droppable-element'
                        draggable={true}
                        unselectable='on'
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', '')}
                    >
                        Drag Element3
                    </div>
                </div>
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
        </div>
    );
};

export default MyPage;
