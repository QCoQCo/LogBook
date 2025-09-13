import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// BlogContext 생성
const BlogContext = createContext();

export const BlogProvider = ({ children }) => {
    // Blog GridLayout 관련 상태
    const [layout, setLayout] = useState([]);
    const [draggingItem, setDraggingItem] = useState(null);
    const [clickedItem, setClickedItem] = useState(null);
    const [elements, setElements] = useState([]);
    const [isBlogEditting, setIsBlogEditting] = useState(false);

    // 게시글 작성 관련 상태
    const [markdown, setMarkdown] = useState('');
    const [postTitle, setPostTitle] = useState('');

    // 블로그 탭 위치 관리
    const [activeTab, setActiveTabState] = useState(() => {
        const s = sessionStorage.getItem('logbook_activeTab');
        return s ? Number(s) : 1;
    });

    const setActiveTab = useCallback((n) => {
        setActiveTabState(n);
        try {
            sessionStorage.setItem('logbook_activeTab', String(n));
        } catch (e) {}
    }, []);

    // Blog 상태 관련 값들
    const blogValues = useMemo(
        () => ({
            layout,
            setLayout,
            draggingItem,
            setDraggingItem,
            clickedItem,
            setClickedItem,
            elements,
            setElements,
            isBlogEditting,
            setIsBlogEditting,
        }),
        [
            layout,
            setLayout,
            draggingItem,
            setDraggingItem,
            clickedItem,
            setClickedItem,
            elements,
            setElements,
            isBlogEditting,
            setIsBlogEditting,
        ]
    );

    // 게시글 작성 관련 값들
    const postEditorValues = useMemo(
        () => ({
            markdown,
            setMarkdown,
            postTitle,
            setPostTitle,
        }),
        [markdown, setMarkdown, postTitle, setPostTitle]
    );

    const uiBlogState = useMemo(
        () => ({
            activeTab,
            setActiveTab,
        }),
        [activeTab, setActiveTab]
    );

    // 전체 값 통합
    const value = useMemo(
        () => ({
            ...blogValues,
            ...postEditorValues,
            ...uiBlogState,
        }),
        [blogValues, postEditorValues, uiBlogState]
    );

    return <BlogContext.Provider value={value}>{children}</BlogContext.Provider>;
};

export const useBlog = () => {
    const context = useContext(BlogContext);
    if (!context) {
        throw new Error('useBlog must be used within a BlogProvider');
    }
    return context;
};
