// src/utils/axiosInstance.js

import axios from 'axios';
import { store } from '../app/store'; // Redux 스토어 직접 임포트
import { logout } from '../features/auth/authSlice'; // 자동 로그아웃 처리를 위한 액션
import { notifyError } from '../components/Notification'; // 사용자 알림 서비스

/**
 * 프로젝트 전역으로 사용될 axios 인스턴스입니다.
 * 모든 API 요청은 이 인스턴스를 통해 이루어집니다.
 */
const axiosInstance = axios.create({
  baseURL: '/api', // 모든 요청의 기본 URL. Nginx 리버스 프록시 주소와 일치합니다.
  timeout: 10000, // 요청 타임아웃 10초
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- 요청 인터셉터 ---
// 모든 API 요청이 서버로 전송되기 전에 가로채어 특정 작업을 수행합니다.
axiosInstance.interceptors.request.use(
  (config) => {
    // Redux 스토어에서 현재 상태의 토큰을 가져옵니다.
    const token = store.getState().auth.token;

    // 토큰이 존재하면 Authorization 헤더에 'Bearer' 토큰을 추가합니다.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // 수정된 요청 설정을 반환합니다.
  },
  (error) => {
    // 요청 설정 중 에러가 발생하면 처리합니다.
    return Promise.reject(error);
  }
);

// --- 응답 인터셉터 ---
// 서버로부터 응답을 받은 후, then 또는 catch로 처리되기 전에 실행됩니다.
axiosInstance.interceptors.response.use(
  (response) => response, // 성공적인 응답은 그대로 반환합니다.
  (error) => {
    // 서버 응답 에러 처리
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data?.message || '오류가 발생했습니다.';

      switch (status) {
        case 401: // Unauthorized: 인증 실패 (토큰 만료, 유효하지 않은 토큰 등)
          notifyError(errorMessage || '인증이 만료되었습니다. 다시 로그인해주세요.');
          // 필요시 자동 로그아웃 처리
          // store.dispatch(logout());
          // window.location.href = '/login';
          break;
        case 403: // Forbidden: 권한 없음
          notifyError(errorMessage || '요청에 대한 권한이 없습니다.');
          break;
        case 404: // Not Found: 요청한 리소스를 찾을 수 없음
          notifyError(errorMessage || '요청한 페이지를 찾을 수 없습니다.');
          break;
        case 500: // Internal Server Error: 서버 내부 오류
          notifyError(errorMessage || '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
          break;
        default: // 기타 4xx 클라이언트 오류
          notifyError(errorMessage);
          break;
      }
    } else if (axios.isAxiosError(error) && error.request) {
      // 네트워크 에러: 요청은 성공했으나 응답을 받지 못함
      notifyError('서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
    } else {
      // 기타 에러 (요청 설정 오류 등)
      notifyError(error.message || '알 수 없는 오류가 발생했습니다.');
    }
    
    // 처리된 에러를 컴포넌트의 catch 블록으로 다시 전달합니다.
    return Promise.reject(error);
  }
);

export default axiosInstance;
