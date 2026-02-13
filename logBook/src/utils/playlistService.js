import apiClient from './apiClient';

// 1. 플레이리스트 생성
export const createPlaylist = async (title) => {
    const response = await apiClient.post('/playlists', { title });
    return response.data;
};

// 2. 특정 유저의 플레이리스트 목록 조회
export const getMyPlaylists = async (userId) => {
    // userId가 string(loginId)이든 number(pk)이든 서버가 알아서 처리
    const response = await apiClient.get('/playlists', {
        params: { userId },
    });
    return response.data;
};

// 3. 플레이리스트 상세 조회 (아이템 포함)
export const getPlaylistDetail = async (playlistId) => {
    const response = await apiClient.get(`/playlists/${playlistId}`);
    return response.data;
};

// 4. 아이템 추가
export const addPlaylistItem = async (playlistId, itemData) => {
    // itemData: { title, link, thumbnail, seq }
    const response = await apiClient.post(`/playlists/${playlistId}/items`, itemData);
    return response.data;
};

// 5. 플레이리스트 삭제
export const deletePlaylist = async (playlistId) => {
    const response = await apiClient.delete(`/playlists/${playlistId}`);
    return response.data;
};

// 6. 아이템 삭제
export const deletePlaylistItem = async (itemId) => {
    const response = await apiClient.delete(`/playlists/items/${itemId}`);
    return response.data;
};

// 7. 플레이리스트 제목 수정
export const updatePlaylistTitle = async (playlistId, title) => {
    const response = await apiClient.patch(`/playlists/${playlistId}`, { title });
    return response.data;
};

// 8. 플레이리스트 아이템 수정
export const updatePlaylistItem = async (itemId, itemData) => {
    const response = await apiClient.patch(`/playlists/items/${itemId}`, itemData);
    return response.data;
};

// 9. 플레이리스트 아이템 일괄 수정 (순서 등)
export const updatePlaylistItemsBatch = async (playlistId, items) => {
    // items: [{ id, seq, title, link, thumbnail }, ...]
    const response = await apiClient.patch(`/playlists/${playlistId}/items/batch`, items);
    return response.data;
};
