import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useEffect } from 'react';

// PostContext 생성
const PostContext = createContext();

export const PostProvider = ({ children }) => {
    // Post Detail 관련 상태
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        let mounted = true;
        fetch('/data/initData.json')
            .then((r) => r.json())
            .then((data) => {
                if (!mounted) return;
                setPosts(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                if (!mounted) return;
                setPosts([]);
            });
        return () => (mounted = false);
    }, []);

    // Post Editor 관련 상태
    const [markdown, setMarkdown] = useState('');
    const [postTitle, setPostTitle] = useState('');
    const [postTags, setPostTags] = useState([]);

    // Post Detail 관련 값들
    const postDetailValues = useMemo(
        () => ({
            posts,
            setPosts,
        }),
        [posts, setPosts]
    );

    // Post Editor 관련 값들
    const postEditorValues = useMemo(
        () => ({
            markdown,
            setMarkdown,
            postTitle,
            setPostTitle,
            postTags,
            setPostTags,
        }),
        [markdown, setMarkdown, postTitle, setPostTitle, postTags, setPostTags]
    );

    // 전체 값 통합
    const value = useMemo(
        () => ({
            ...postDetailValues,
            ...postEditorValues,
        }),
        [postDetailValues, postEditorValues]
    );

    return <PostContext.Provider value={value}>{children}</PostContext.Provider>;
};

export const usePost = () => {
    const context = useContext(PostContext);
    if (!context) {
        throw new Error('usePost must be used within a PostProvider');
    }

    return context;
};
