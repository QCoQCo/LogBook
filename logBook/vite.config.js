import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    // .env를 프로젝트 루트(PJ02)에서 로드
    envDir: path.resolve(__dirname, '..'),

    // sockjs-client 등 Node 스타일 모듈이 global을 참조할 때 브라우저 호환
    define: {
        global: 'globalThis',
    },

    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                ws: true, // WebSocket (SockJS) 프록시
            },
        }
    }
});
