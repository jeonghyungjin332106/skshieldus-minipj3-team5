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

# 첫 번째 Stage에서 빌드된 React 앱의 결과물을 Nginx의 public directory로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# --- [수정된 부분: nginx.conf 파일을 /etc/nginx/conf.d/default.conf 로 복사] ---
# Nginx의 기본 설정 파일 중 하나를 덮어씁니다.
# 이렇게 하면 Nginx 엔트리포인트 스크립트의 영향을 받지 않고 우리의 설정이 적용됩니다.
COPY nginx.conf /etc/nginx/conf.d/default.conf
# --- [수정 끝] ---

# 프론트엔드 컨테이너는 80번 포트를 외부에 노출합니다.
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]