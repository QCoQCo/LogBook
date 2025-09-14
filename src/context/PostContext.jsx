import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// PostContext 생성
const PostContext = createContext();

export const PostProvider = ({ children }) => {
    // Post Editor 관련 상태
    const [markdown, setMarkdown] = useState('');
    const [postTitle, setPostTitle] = useState('');

    // Post Detail 관련 상태

    // Post Editor 관련 값들
    const postEditorValues = useMemo(
        () => ({
            markdown,
            setMarkdown,
            postTitle,
            setPostTitle,
        }),
        [markdown, setMarkdown, postTitle, setPostTitle]
    );

    // Post Detail 관련 값들

    // 전체 값 통합
    const value = useMemo(
        () => ({
            ...postEditorValues,
        }),
        [postEditorValues]
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
