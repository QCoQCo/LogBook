import { Routes, Route } from 'react-router-dom';
import * as Pages from '../components/pages';

const PostRoutes = () => {
    return (
        <Routes>
            <Route path='/detail' element={<Pages.PostDetail />} />
            <Route path='/edit' element={<Pages.PostEdit isEdit={true} />} />
            <Route path='/write' element={<Pages.PostEdit isEdit={false} />} />
        </Routes>
    );
};

export default PostRoutes;
