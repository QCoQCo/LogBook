import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// UserDataContext 생성
const UserDataContext = createContext();

// 공통 유틸리티 함수들
const isGuestUser = (userId) => {
    return !userId || userId.startsWith('guest_');
};

export const UserDataProvider = ({ children }) => {
    // 사용자 데이터 관리
    const [userData, setUserData] = useState([]);
    const [userDataLoading, setUserDataLoading] = useState(false);
    const [userDataLoaded, setUserDataLoaded] = useState(false);

    // 사용자 데이터 로딩 함수
    const loadUserData = useCallback(async () => {
        if (userDataLoaded || userDataLoading) return; // 이미 로드되었거나 로딩 중이면 중복 실행 방지

        try {
            setUserDataLoading(true);
            const response = await fetch('/data/userData.json');
            if (!response.ok) {
                throw new Error('사용자 데이터 로딩 실패');
            }
            const users = await response.json();
            setUserData(users);
            setUserDataLoaded(true);
        } catch (error) {
            console.error('사용자 데이터 로드 실패:', error);
        } finally {
            setUserDataLoading(false);
        }
    }, [userDataLoaded, userDataLoading]);

    // 사용자 데이터를 Map으로 변환하여 검색 성능 향상
    const userDataMap = useMemo(() => {
        const map = new Map();
        userData.forEach((user) => {
            // userId로 인덱싱
            if (user.userId) {
                map.set(user.userId, user);
            }
            // nickName으로도 인덱싱 (중복 허용)
            if (user.nickName && !map.has(user.nickName)) {
                map.set(user.nickName, user);
            }
        });
        return map;
    }, [userData]);

    // userId 또는 userName으로 사용자 프로필 사진 가져오기 (성능 최적화)
    const getUserProfilePhoto = useCallback(
        (userId, userName) => {
            // 게스트 사용자인 경우 null 반환
            if (isGuestUser(userId)) {
                return null;
            }

            // Map을 사용하여 O(1) 검색
            const user = userDataMap.get(userId) || userDataMap.get(userName);
            return user?.profilePhoto || null;
        },
        [userDataMap]
    );

    // 사용자 정보 전체 가져오기 (성능 최적화)
    const getUserInfo = useCallback(
        (userId, userName) => {
            // 게스트 사용자인 경우 null 반환
            if (isGuestUser(userId)) {
                return null;
            }

            // Map을 사용하여 O(1) 검색
            return userDataMap.get(userId) || userDataMap.get(userName) || null;
        },
        [userDataMap]
    );

    // 사용자 닉네임 업데이트 함수
    const updateUserNickname = useCallback((userId, newNickname) => {
        try {
            // 여기에서는 로컬 상태 업데이트만 처리
            // 실제 데이터베이스 업데이트는 ChatPage에서 처리
            return true;
        } catch (err) {
            console.error('닉네임 업데이트 오류:', err);
            return false;
        }
    }, []);

    // 사용자 데이터 로드 (컴포넌트 마운트 시)
    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    // 사용자 데이터 관련 값들
    const userDataValues = useMemo(
        () => ({
            userData,
            userDataLoading,
            userDataLoaded,
            loadUserData,
            getUserProfilePhoto,
            getUserInfo,
            updateUserNickname,
        }),
        [
            userData,
            userDataLoading,
            userDataLoaded,
            loadUserData,
            getUserProfilePhoto,
            getUserInfo,
            updateUserNickname,
        ]
    );

    return <UserDataContext.Provider value={userDataValues}>{children}</UserDataContext.Provider>;
};

export const useUserData = () => {
    const context = useContext(UserDataContext);
    if (!context) {
        throw new Error('useUserData must be used within a UserDataProvider');
    }
    return context;
};
