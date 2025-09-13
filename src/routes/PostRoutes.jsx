import { Routes, Route } from 'react-router-dom';
import PostDetail from '../components/pages/PostDetail';
import PostEdit from '../components/pages/PostEdit';

const PostRoutes = () => {
    return (
        <Routes>
            <Route path='/detail' element={<PostDetail />} />
            <Route path='/edit' element={<PostEdit isEdit={true} />} />
            <Route path='/write' element={<PostEdit isEdit={false} />} />
        </Routes>
    );
};

export default PostRoutes;
