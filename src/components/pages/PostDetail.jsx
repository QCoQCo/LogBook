import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useLogBook } from '../../context/LogBookContext';
import * as Post from '../post';
import './PostDetail.scss';

const PostDetail = () => {
    const { userData } = useLogBook();

    const [searchParam] = useSearchParams();
    const postId = parseInt(searchParam.get('postId'));

    const [currentPost, setCurrentPost] = useState(null);
    const [postOwner, setPostOwner] = useState(null);

    useEffect(() => {
        getPostData();
    }, [postId, userData]);

    const getPostData = async () => {
        try {
            const res = await axios.get('/data/initData.json');
            const post = res.data.find((p) => p.postId === postId);

            if (post && userData) {
                const owner = userData.find((user) => user.id === post.userId);
                setCurrentPost(post);
                setPostOwner(owner);
            }
        } catch (error) {
            console.error('게시글 데이터 로딩 오류: ', error);
        }
    };

    return (
        <div id='PostDetail'>
            {currentPost && postOwner ? (
                <div>
                    <div className='post-title'>{currentPost.title}</div>
                    <div className='post-info-area'>
                        <div className='post-info-top'>
                            <div className='post-info-left'>
                                <Link to={``} className='post-owner'>
                                    {postOwner.nickName}
                                </Link>
                                <span>•</span>
                                <p className='post-created-at'>
                                    {new Date(currentPost.createdAt).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                    })}
                                </p>
                            </div>
                            <button className='follow-post-owner'>팔로우</button>
                        </div>
                        <div className='post-tags'>
                            {currentPost.tags.map((tag) => (
                                <button className='tag-button' onClick={() => {}} key={tag}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Post.PostViewer markdown={currentPost.content} />
                    <div className='post-owner'></div>
                    <div className='post-comments'></div>
                </div>
            ) : (
                <div>게시물을 불러오는 중입니다...</div>
            )}
        </div>
    );
};

export default PostDetail;
