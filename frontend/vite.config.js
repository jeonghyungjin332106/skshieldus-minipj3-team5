// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // 프론트엔드 개발 서버 포트 (http://localhost:3000)
    proxy: {
      '/api': {
        // Docker Compose 환경에서는 백엔드 서비스 이름과 내부 포트를 사용합니다.
        target: 'http://backend:8080', // <-- 여기가 수정되었습니다!
        changeOrigin: true, // 대상 호스트의 원본을 변경합니다 (CORS 문제 해결에 도움).
        secure: false,    // 개발 환경에서 HTTPS 인증서 문제 방지 (선택 사항).
        // rewrite: (path) => path.replace(/^\/api/, ''), // '/api' 경로를 제거하고 백엔드로 전달
        // rewrite 규칙이 명시적으로 없으면 기본적으로 '/api'를 포함하여 전달될 수 있습니다.
        // 백엔드 API 경로가 '/api/auth/login'처럼 '/api'를 포함한다면 rewrite는 필요 없을 수 있습니다.
        // 하지만 일반적으로 '/api'를 제거하고 백엔드 라우팅에 맞추는 경우가 많습니다.
        // 백엔드가 '/auth/login'을 기대한다면 rewrite 규칙을 포함하는 것이 좋습니다.
        // 현재 백엔드 로그에 '/api/conversations/conv_resume_1'로 요청이 찍히는 것으로 보아,
        // 백엔드가 '/api'를 포함한 경로를 처리하는 것으로 추정되므로, 일단 rewrite는 주석 처리된 상태로 유지합니다.
        // 만약 백엔드에서 404가 발생한다면 rewrite 규칙을 활성화해 보세요.
      }
    }
  }
});