# 빌드 단계: Vite 애플리케이션 빌드
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
# 의존성 충돌 무시 옵션 추가
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# 실행 단계: Nginx로 정적 파일 서빙
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
# 경로를 상대경로로 확실히 지정
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
