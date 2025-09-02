import axios from 'axios';
import ReactGridLayout from 'react-grid-layout';
import { useEffect, useState } from 'react';
import { useLogBook } from '../../context/LogBookContext';
import BlogLayoutItem from './BlogLayoutItem';

const BlogGridLayout = ({ userId, enableModal }) => {
    const [layout, setLayout] = useState([]);
    const [newItemCounter, setNewItemCounter] = useState(0);
    const { draggingItem, setElements } = useLogBook();

    useEffect(() => {
        getUserBlogData();
    }, [userId]);

    const getUserBlogData = async () => {
        try {
            const response = await axios.get('/data/blogData.json');

            if (response.data.blogData) {
                const blogData = response.data.blogData;
                const layoutByUserId = blogData.find((data) => data.userId === userId).layout;
                const elementByUserId = blogData.find((data) => data.userId === userId).elements;

                setLayout([...layoutByUserId]);
                setElements([...elementByUserId]);
                setNewItemCounter(layoutByUserId.length);
            }
        } catch (e) {
            console.error('블로그 데이터 로딩 실패: ', e);
        }
    };

    const handleClickDelete = (i) => {
        setLayout((prev) => prev.filter((item) => item.i !== i));
    };

    const onLayoutChange = (newLayout) => {
        setLayout(newLayout);
    };

    const onDrop = (currentLayout, droppedItemProps, e) => {
        if (!draggingItem) return;

        const { x, y } = droppedItemProps;
        const newId = `${draggingItem.className}-${newItemCounter}`;
        const w = draggingItem.w;
        const h = draggingItem.h;

        const isOverlap = layout.some(
            (item) => item.x < x + w && item.x + item.w > x && item.y < y + h && item.y + item.h > y
        );

        const newItem = {
            i: newId,
            x: x,
            y: y,
            w: w,
            h: h,
        };

        let finalLayout;
        if (isOverlap) {
            const newLayout = layout.map((item) => {
                // 드롭된 아이템의 x, y와 겹치는 아이템들을 아래로 이동
                if (item.x < x + w && item.x + item.w > x && item.y >= y) {
                    return { ...item, y: item.y + h };
                }
                return item;
            });
            finalLayout = [...newLayout, newItem];
        } else {
            finalLayout = [...layout, newItem];
        }

        setLayout(finalLayout);
        setElements((prev) => [...prev, { i: newId, content: null }]);
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
            }
        });
    };

    return (
        <div className='blog-area'>
            <ReactGridLayout
                key={userId}
                layout={layout}
                cols={5}
                rowHeight={80}
                width={900}
                onDrop={onDrop}
                isDroppable={true}
                isDraggable={true}
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
