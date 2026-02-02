import apiClient from './apiClient';

// 1. 플레이리스트 생성
export const createPlaylist = async (title) => {
    const response = await apiClient.post('/playlist', { title });
    return response.data;
};

// 2. 특정 유저의 플레이리스트 목록 조회
export const getMyPlaylists = async (userId) => {
    // userId가 string(loginId)이든 number(pk)이든 서버가 알아서 처리
    const response = await apiClient.get('/playlist', {
        params: { userId },
    });
    return response.data;
};

// 3. 플레이리스트 상세 조회 (아이템 포함)
export const getPlaylistDetail = async (playlistId) => {
    const response = await apiClient.get(`/playlist/${playlistId}`);
    return response.data;
};

// 4. 아이템 추가
export const addPlaylistItem = async (playlistId, itemData) => {
    // itemData: { title, link, thumbnail, seq }
    const response = await apiClient.post(`/playlist/${playlistId}/items`, itemData);
    return response.data;
};

// 5. 플레이리스트 삭제
export const deletePlaylist = async (playlistId) => {
    const response = await apiClient.delete(`/playlist/${playlistId}`);
    return response.data;
};

// 6. 아이템 삭제
export const deletePlaylistItem = async (itemId) => {
    const response = await apiClient.delete(`/playlist/items/${itemId}`);
    return response.data;
};

// 7. 플레이리스트 제목 수정
export const updatePlaylistTitle = async (playlistId, title) => {
    const response = await apiClient.patch(`/playlist/${playlistId}`, { title });
    return response.data;
};

// 8. 플레이리스트 아이템 수정
export const updatePlaylistItem = async (itemId, itemData) => {
    const response = await apiClient.patch(`/playlist/items/${itemId}`, itemData);
    return response.data;
};
