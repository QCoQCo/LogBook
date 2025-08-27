import axios from 'axios';
import { useEffect, useState } from 'react';
import BlogDroppable from './BlogDroppable';

const BlogFloatingUi = () => {
    const [droppables, setDroppables] = useState([]);

    useEffect(() => {
        getDroppableItems();
    }, []);

    const getDroppableItems = async () => {
        try {
            const response = await axios('/data/blogDroppablesData.json');
            setDroppables(response.data);
        } catch (e) {
            console.error('플로팅 UI 데이터 로딩 실패: ', e);
        }
    };

    return (
        <div className='floating-droppables-ui'>
            {droppables.map((item) => (
                <BlogDroppable droppableItem={item} key={item.id} />
            ))}
        </div>
    );
};

export default BlogFloatingUi;
