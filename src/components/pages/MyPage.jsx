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
    // layout 상태를 useState로 관리하여 동적 변경이 가능하게 합니다.
    const [layout, setLayout] = useState(initialLayout);

    // 드롭된 아이템의 내용에 대한 카운터를 useState로 관리합니다.
    const [newItemCounter, setNewItemCounter] = useState(0);

    const onDrop = (currentLayout, droppedItemProps) => {
        // 새로운 아이템에 대한 고유한 ID를 생성합니다.
        setNewItemCounter((prevCounter) => {
            const newId = `new-item-${prevCounter}`;
            const newItem = {
                i: newId,
                x: droppedItemProps.x,
                y: droppedItemProps.y,
                w: 1, // 드롭 시 새로운 아이템의 기본 크기를 지정
                h: 1, // 드롭 시 새로운 아이템의 기본 크기를 지정
            };
            // layout 상태 업데이트는 prevLayout을 사용
            setLayout((prevLayout) => [...prevLayout, newItem]);

            console.log(newItem);
            return prevCounter + 1;
        });

        console.log('레이아웃', layout);
        console.log('아이템', droppedItemProps);

        // 카운터를 증가시켜 다음 아이템에 고유한 ID를 부여합니다.
        setNewItemCounter((prevCounter) => prevCounter + 1);
    };

    // 레이아웃 데이터를 기반으로 아이템을 렌더링하는 함수입니다.
    const renderGridItems = () => {
        return layout.map((item) => {
            const isNewItem = item.i.startsWith('new-item');
            const itemText = isNewItem
                ? `New Item ${item.i.split('-').pop()}`
                : item.i.replace(/-/g, ' ').toUpperCase();

            return (
                <div className={isNewItem ? 'new-grid-item' : item.i} key={item.i}>
                    <div className='grid-item-text'>{itemText}</div>
                </div>
            );
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
                >
                    {renderGridItems()}
                </ReactGridLayout>
            </div>
        </div>
    );
};

export default MyPage;
