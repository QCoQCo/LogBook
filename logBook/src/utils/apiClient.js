import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:8080/api",
});

// 요청 인터셉터: logbook_current_user에서 token 가져오기
apiClient.interceptors.request.use((config) => {
    try {
        const raw =
            sessionStorage.getItem("logbook_current_user") ||
            localStorage.getItem("logbook_current_user");
        if (raw) {
            const user = JSON.parse(raw);
            if (user.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
    } catch (e) {}
    return config;
});

export default apiClient;
