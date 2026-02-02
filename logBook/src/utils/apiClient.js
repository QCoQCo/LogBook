import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:8080/api",
});

// JWT 토큰 만료 시간 확인 함수 (초 단위)
const getTokenExpiration = (token) => {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp;
    } catch (e) {
        return 0;
    }
};

// 요청 인터셉터: 토큰 자동 갱신 및 Authorization 헤더 추가
apiClient.interceptors.request.use(async (config) => {
    try {
        const raw = sessionStorage.getItem("logbook_current_user") || localStorage.getItem("logbook_current_user");
        if (raw) {
            const user = JSON.parse(raw);
            if (user.token) {
                const now = Math.floor(Date.now() / 1000);
                const exp = getTokenExpiration(user.token);

                // 만료 5분(300초) 전이면 갱신 시도
                if (exp - now < 300) {
                    try {
                        const response = await axios.post("http://localhost:8080/api/auth/refresh", {}, {
                            headers: { Authorization: `Bearer ${user.token}` }
                        });
                        const newToken = response.data;
                        user.token = newToken;

                        // 갱신된 정보 저장
                        const storage = sessionStorage.getItem("logbook_current_user") ? sessionStorage : localStorage;
                        storage.setItem("logbook_current_user", JSON.stringify(user));
                    } catch (refreshError) {
                        console.error("Token refresh failed:", refreshError);
                        // 갱신 실패해도 일단 원래 요청은 보냄 (관리자 판단에 따름)
                    }
                }
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
    } catch (e) {
        console.error("Interceptor error:", e);
    }
    return config;
});

export default apiClient;
