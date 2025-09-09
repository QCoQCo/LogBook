import * as Post from '../post';
import './PostEdit.scss'; // 별도의 CSS 파일로 스타일링

const PostEdit = () => {
    return (
        <div className='post-editor-container'>
            <Post.PostEditor />
            <Post.PostPreview />
        </div>
    );
};

export default PostEdit;
