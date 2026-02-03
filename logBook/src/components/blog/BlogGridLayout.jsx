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

        const newItem = {
            i: newId,
            x: x,
            y: y,
            w: w,
            h: h,
        };

        // Helper: check rectangle overlap
        const rectsOverlap = (a, b) =>
            a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

        // Resolve collisions by iteratively pushing overlapping items down.
        const resolveCollisions = (existingLayout, insertedItem) => {
            // Copy items (avoid mutating original layout)
            const items = existingLayout.map((it) => ({ ...it }));
            items.push({ ...insertedItem });

            let moved = false;
            let safety = 1000;
            do {
                moved = false;
                // Sort top-to-bottom, left-to-right to give deterministic behavior
                items.sort((a, b) => a.y - b.y || a.x - b.x);

                for (let i = 0; i < items.length; i++) {
                    for (let j = 0; j < items.length; j++) {
                        if (i === j) continue;
                        const a = items[i];
                        const b = items[j];
                        if (rectsOverlap(a, b)) {
                            // push the lower item down so it sits just below the other
                            if (a.y <= b.y) {
                                const targetY = a.y + a.h;
                                if (b.y !== targetY) {
                                    b.y = targetY;
                                    moved = true;
                                }
                            } else {
                                const targetY = b.y + b.h;
                                if (a.y !== targetY) {
                                    a.y = targetY;
                                    moved = true;
                                }
                            }
                        }
                    }
                }
                safety--;
            } while (moved && safety > 0);

            if (safety <= 0) {
                console.warn("resolveCollisions: safety limit reached while resolving layout");
            }

            return items;
        };

        const finalLayout = resolveCollisions(layout, newItem);

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
