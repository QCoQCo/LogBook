import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../utils/apiClient';

// UserDataContext 생성
const UserDataContext = createContext();

// 공통 유틸리티 함수들
const isGuestUser = (userId) => {
    return !userId || (typeof userId === 'string' && userId.startsWith('guest_'));
};

export const UserDataProvider = ({ children }) => {
    // 사용자 데이터 관리
    const [userData, setUserData] = useState([]);
    const [userDataLoading, setUserDataLoading] = useState(false);
    const [userDataLoaded, setUserDataLoaded] = useState(false);

    // 사용자 데이터 로딩 함수 (백엔드 API 사용, 실패 시 빈 배열로 완료)
    const loadUserData = useCallback(async () => {
        if (userDataLoaded || userDataLoading) return; // 이미 로드되었거나 로딩 중이면 중복 실행 방지

        try {
            setUserDataLoading(true);
            const { data } = await apiClient.get('/users', { params: { limit: 500 } });
            // 백엔드 DTO: id, loginId, nickName, userEmail, profilePhoto, introduction
            // 프론트 호환: userId(loginId)로 Map 검색하므로 userId 필드 추가
            const users = Array.isArray(data) ? data.map((u) => ({ ...u, userId: u.loginId })) : [];
            setUserData(users);
            setUserDataLoaded(true);
        } catch (error) {
            // 401(미로그인) 등으로 실패해도 빈 배열로 완료 처리하여 재시도 가능
            if (error?.response?.status === 401) {
                setUserData([]);
            }
            setUserDataLoaded(true);
            if (error?.response?.status !== 401) {
                console.error('사용자 데이터 로드 실패:', error);
            }
        } finally {
            setUserDataLoading(false);
        }
    }, [userDataLoaded, userDataLoading]);

    // 로그인 후 사용자 목록 재요청용 (userDataLoaded 초기화 후 loadUserData 호출)
    const refetchUserData = useCallback(() => {
        setUserDataLoaded(false);
        setUserDataLoading(false);
    }, []);

    // 사용자 데이터를 Map으로 변환하여 검색 성능 향상
    const userDataMap = useMemo(() => {
        const map = new Map();
        userData.forEach((user) => {
            // userId(loginId)로 인덱싱
            if (user.userId) {
                map.set(user.userId, user);
            }
            // id(DB PK)로도 인덱싱 (헤더 등에서 currentUser.id로 조회)
            if (user.id != null) {
                map.set(user.id, user);
            }
            // nickName으로도 인덱싱 (중복 허용)
            if (user.nickName && !map.has(user.nickName)) {
                map.set(user.nickName, user);
            }
        });
        return map;
    }, [userData]);

    // userId 또는 nickName으로 사용자 프로필 사진 가져오기 (백엔드 nickName과 동일)
    const getUserProfilePhoto = useCallback(
        (userId, nickName) => {
            // 게스트 사용자인 경우 null 반환
            if (isGuestUser(userId)) {
                return null;
            }

            // Map을 사용하여 O(1) 검색
            const user = userDataMap.get(userId) || userDataMap.get(nickName);
            return user?.profilePhoto || null;
        },
        [userDataMap]
    );

    // 사용자 정보 전체 가져오기 (백엔드 nickName과 동일)
    const getUserInfo = useCallback(
        (userId, nickName) => {
            // 게스트 사용자인 경우 null 반환
            if (isGuestUser(userId)) {
                return null;
            }

            // Map을 사용하여 O(1) 검색
            return userDataMap.get(userId) || userDataMap.get(nickName) || null;
        },
        [userDataMap]
    );

    // 사용자 캐시 갱신 (프로필 수정 등으로 한 명의 데이터만 반영할 때)
    const updateUserInCache = useCallback((identifier, updates) => {
        if (updates == null || Object.keys(updates).length === 0) return;
        setUserData((prev) =>
            prev.map((u) => {
                const match =
                    u.id === identifier || u.userId === identifier || u.loginId === identifier;
                return match ? { ...u, ...updates } : u;
            })
        );
    }, []);

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
            refetchUserData,
            getUserProfilePhoto,
            getUserInfo,
            updateUserInCache,
            updateUserNickname,
        }),
        [
            userData,
            userDataLoading,
            userDataLoaded,
            loadUserData,
            refetchUserData,
            getUserProfilePhoto,
            getUserInfo,
            updateUserInCache,
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
