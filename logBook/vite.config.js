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

    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
            // 혹시 다른 API가 더 있다면 여기에 추가 가능
        }
    }
});
