# frontend/Dockerfile

# Stage 1: React 애플리케이션 빌드
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./ 
RUN npm install
COPY . .
RUN npm run build

# Stage 2: 빌드된 애플리케이션을 Nginx 웹 서버로 서빙
FROM nginx:alpine

# --- [최종 수정: /app/dist 폴더에서 복사] ---
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx의 기본 설정 파일 중 하나를 덮어씁니다.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 프론트엔드 컨테이너는 80번 포트를 외부에 노출합니다.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]