import React, { useState } from 'react';
import * as Post from '../post';
import './PostEdit.scss'; // 별도의 CSS 파일로 스타일링

const PostEdit = () => {
    const [markdown, setMarkdown] = useState('');
    const [postTitle, setPostTitle] = useState('');

    const handleMarkdownChange = (e) => {
        setMarkdown(e.target.value);
    };

    const handleTitleChange = (e) => {
        setPostTitle(e.target.value);
    };

    return (
        <div className='post-editor-container'>
            <Post.PostEditor
                markdown={markdown}
                postTitle={postTitle}
                handleMarkdownChange={handleMarkdownChange}
                handleTitleChange={handleTitleChange}
            />
            <Post.PostPreview markdown={markdown} postTitle={postTitle} />
        </div>
    );
};

export default PostEdit;
