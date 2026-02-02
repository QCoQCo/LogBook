import axios from "axios";
import ReactGridLayout from "react-grid-layout";
import { useEffect, useState } from "react";
import { useBlog } from "../../context";
import BlogLayoutItem from "./BlogLayoutItem";
import apiClient from "../../utils/apiClient";

const BlogGridLayout = ({ userId, enableModal }) => {
    const [newItemCounter, setNewItemCounter] = useState(0);
    const { layout, setLayout, draggingItem, setElements, isBlogEditting } = useBlog();

    useEffect(() => {
        getUserBlogData();
    }, [userId]);

    const getUserBlogData = async () => {
        try {
            const response = await axios.get(`/api/blogs/${userId}`);
            const blogData = response.data;

            if (!blogData || !blogData.layout) {
                setLayout([]);
                setElements([]);
                setNewItemCounter(0);
                return;
            }

            const layoutData = blogData.layout;
            const elementData = blogData.elements;

            const numbersFromLayoutId = layoutData.map((item) => parseInt(item.i.split("-")[1]));

            setLayout(layoutData);
            setElements(elementData);
            setNewItemCounter(
                numbersFromLayoutId.length > 0 ? Math.max(...numbersFromLayoutId) + 1 : 0,
            );
            setNewItemCounter(0);
        } catch (e) {
            console.error("블로그 데이터 로딩 실패: ", e);
            setLayout([]);
            setElements([]);
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
            (item) =>
                item.x < x + w && item.x + item.w > x && item.y < y + h && item.y + item.h > y,
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

        // console.log(newItemCounter, '추가됨');

        setLayout(finalLayout);
        setElements((prev) => [...prev, { i: newId, content: null }]);
        setNewItemCounter((prevCounter) => prevCounter + 1);
    };

    const renderGridItems = () => {
        return layout.map((item) => {
            if (item.i !== "__dropping-elem__") {
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
        <div className="blog-area">
            <ReactGridLayout
                key={userId}
                layout={layout}
                cols={5}
                rowHeight={80}
                width={900}
                onDrop={onDrop}
                isDroppable={isBlogEditting}
                isDraggable={isBlogEditting}
                isResizable={isBlogEditting}
                draggableHandle=".grid-item-text"
                droppingItem={{
                    i: "__dropping-elem__",
                    w: draggingItem ? draggingItem.w : 1,
                    h: draggingItem ? draggingItem.h : 1,
                }}
                compactType={"vertical"}
                onLayoutChange={onLayoutChange}
            >
                {renderGridItems()}
            </ReactGridLayout>
        </div>
    );
};

export default BlogGridLayout;
