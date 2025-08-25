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

    const onDrop = (currentLayout, droppedItemProps) => {
        const newId = `new-item-${newItemCounter}`;

        const newItem = {
            i: newId,
            x: droppedItemProps.x,
            y: droppedItemProps.y,
            w: droppedItemProps.w,
            h: droppedItemProps.h,
        };

        setLayout([...currentLayout, newItem]);

        setNewItemCounter((prevCounter) => prevCounter + 1);
    };

    const renderGridItems = () => {
        return layout.map((item) => {
            if (item.i.startsWith('new-item')) {
                return (
                    <div key={item.i} className='new-grid-item'>
                        <div className='grid-item-text'>New Item {newItemCounter}</div>
                    </div>
                );
            } else {
                return (
                    <div className={item.i} key={item.i}>
                        <div className='grid-item-text'>
                            {item.i.replace(/-/g, ' ').toUpperCase()}
                        </div>
                    </div>
                );
            }
        });
    };

    return (
        <div id='MyPage'>
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
                rowHeight={273}
                width={1000}
                onDrop={onDrop}
                isDroppable={true}
                compactType={'vertical'}
            >
                {renderGridItems()}
            </ReactGridLayout>
        </div>
    );
};

export default MyPage;
