import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// UIContext 생성
const UIContext = createContext();

export const UIProvider = ({ children }) => {
    const [isChatPage, setIsChatPage] = useState(false); //채팅페이지에서는 다크모드적용

    //헤더 로그인 모달
    const [showLogin, setShowLogin] = useState(false);
    const toggleLogin = () => setShowLogin((s) => !s);

    // UI 상태 관련 값들
    const uiValues = useMemo(
        () => ({
            isChatPage,
            setIsChatPage,
            showLogin,
            toggleLogin,
        }),
        [isChatPage, setIsChatPage, showLogin, toggleLogin]
    );

    return <UIContext.Provider value={uiValues}>{children}</UIContext.Provider>;
};

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
