# frontend/Dockerfile

# Stage 1: React 애플리케이션 빌드 (변경 없음)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./ 
RUN npm install
COPY . .
RUN npm run build

# Stage 2: 빌드된 애플리케이션을 Nginx 웹 서버로 서빙
FROM nginx:alpine

# 첫 번째 Stage에서 빌드된 React 앱의 결과물을 Nginx의 public directory로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# --- [추가된 부분] ---
# 위에서 작성한 nginx.conf 파일을 컨테이너의 기본 설정 파일 위치로 복사합니다.
# 이 설정이 기존 Nginx 설정을 덮어쓰게 됩니다.
COPY nginx.conf /etc/nginx/conf.d/default.conf
# --- [추가 끝] ---

# 프론트엔드 컨테이너는 80번 포트를 노출합니다.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
