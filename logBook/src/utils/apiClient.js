import axios from "axios";
import { sendAuthEvent } from "./sessionSync";

const apiClient = axios.create({
    baseURL: "http://localhost:8080/api",
});

// JWT 토큰 만료 시간 확인 함수 (초 단위)
const getTokenExpiration = (token) => {
    try {
        if (!token) return 0;
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );
        const payload = JSON.parse(jsonPayload);
        return payload.exp || 0;
    } catch (e) {
        return 0;
    }
};

// [Singleton Refresh 관리를 위한 변수]
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

// 요청 인터셉터: 토큰 자동 갱신 및 Authorization 헤더 추가
apiClient.interceptors.request.use(async (config) => {
    // refresh 요청 자체는 인터셉터 로직을 타지 않도록 제외 (무한 루프 방지)
    if (config.url.includes("/auth/refresh")) {
        return config;
    }

    try {
        const raw = localStorage.getItem("logbook_current_user") || sessionStorage.getItem("logbook_current_user");
        if (raw) {
            const user = JSON.parse(raw);
            if (user.token) {
                const now = Math.floor(Date.now() / 1000);
                const exp = getTokenExpiration(user.token);

                // 1. 이미 만료된 경우 (즉시 중단)
                if (exp > 0 && exp <= now) {
                    sendAuthEvent("logout");
                    throw new axios.Cancel("Token expired");
                }

                // 2. 만료 임박 (1시간 전) - 동기식(Blocking) Singleton Refresh
                if (exp > 0 && exp - now < 3600) {
                    if (!isRefreshing) {
                        isRefreshing = true;
                        try {
                            const response = await axios.post("http://localhost:8080/api/auth/refresh", {}, {
                                headers: { Authorization: `Bearer ${user.token}` },
                                withCredentials: true
                            });
                            const newToken = response.data.token || response.data;
                            user.token = newToken;
                            const storage = sessionStorage.getItem("logbook_current_user") ? sessionStorage : localStorage;
                            storage.setItem("logbook_current_user", JSON.stringify(user));

                            isRefreshing = false;
                            onTokenRefreshed(newToken);
                        } catch (err) {
                            isRefreshing = false;
                            console.error("Token refresh failed:", err);
                            // 10초 미만 남았는데 갱신 실패시 로그아웃
                            if (exp - now < 10) {
                                sendAuthEvent("logout");
                                throw new axios.Cancel("Session expired");
                            }
                        }
                    } else {
                        // 이미 다른 요청이 갱신 중이면 해당 갱신이 완료될 때까지 Await
                        const newToken = await new Promise((resolve) => subscribeTokenRefresh(resolve));
                        user.token = newToken;
                    }
                }
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        }
    } catch (e) {
        if (axios.isCancel(e)) throw e;
        console.error("Interceptor error:", e);
    }
    return config;
});

// 응답 인터셉터: 401 에러(토큰 만료 등) 시 전역 로그아웃
let isLoggingOut = false;
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // 인터셉터에서 이미 처리하지 못한 401이 발생한 경우 (진짜 만료 등)
        if (error.response && error.response.status === 401) {
            if (!isLoggingOut) {
                isLoggingOut = true;
                sendAuthEvent("logout");
                setTimeout(() => { isLoggingOut = false; }, 2000);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
