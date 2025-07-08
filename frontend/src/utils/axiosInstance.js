// src/utils/axiosInstance.js
import axios from 'axios'; // <-- 여기에 axios 자체를 다시 임포트합니다.
import { store } from '../app/store'; // Redux 스토어를 직접 임포트합니다.
import { logout } from '../features/auth/authSlice'; // 로그아웃 액션 임포트 (401 처리용)
import { notifyError } from '../components/Notification'; // 알림 서비스 임포트

const axiosInstance = axios.create({
  baseURL: '/api', // 백엔드 기본 URL (Vite proxy 설정과 일치)
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 모든 요청이 백엔드로 보내지기 전에 실행됩니다.
axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState(); // Redux 스토어의 현재 상태를 가져옴
    const token = state.auth.token; // 인증 슬라이스에서 저장된 토큰을 가져옴

    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Authorization 헤더에 토큰 추가
    }
    return config; // 수정된 설정 객체를 반환하여 요청을 계속 진행합니다.
  },
  (error) => {
    // 요청 오류 처리
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 응답을 받거나 오류가 발생했을 때 처리할 로직을 추가할 수 있습니다.
axiosInstance.interceptors.response.use(
  (response) => response, // 성공적인 응답은 그대로 전달
  (error) => {
    // Axios 에러인지 확인하고, 서버 응답이 있을 경우 처리
    if (axios.isAxiosError(error) && error.response) { // <-- 여기에 axios.isAxiosError를 사용합니다.
      const status = error.response.status;
      const errorMessage = error.response.data?.message;

      if (status === 401) {
        // 401 Unauthorized: 토큰 만료 또는 유효하지 않음
        console.log('401 Unauthorized: 토큰 만료 또는 유효하지 않음');
        notifyError(errorMessage || '인증이 필요합니다. 다시 로그인해주세요.', { autoClose: 2000 });
        // Redux 로그아웃 액션 디스패치 (자동 로그아웃 처리)
        // 이 부분을 실행하면 토큰이 만료되었을 때 자동으로 로그아웃됩니다.
        // store.dispatch(logout());
        // 페이지 새로고침 또는 로그인 페이지로 강제 이동 (필요시)
        // window.location.href = '/login'; 
      } else if (status === 403) {
        // 403 Forbidden: 권한 없음
        notifyError(errorMessage || '이 작업에 대한 권한이 없습니다.', { autoClose: 2000 });
      } else if (status === 404) {
        // 404 Not Found
        notifyError(errorMessage || '요청한 자원을 찾을 수 없습니다.', { autoClose: 2000 });
      } else if (status >= 500) {
        // 5xx Server Error
        notifyError(errorMessage || '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.', { autoClose: 2000 });
      } else {
        // 기타 4xx 오류
        notifyError(errorMessage || `요청 처리 중 오류가 발생했습니다. (코드: ${status})`, { autoClose: 2000 });
      }
    } else if (axios.isAxiosError(error) && error.request) {
        // 요청은 보내졌지만 응답을 받지 못한 경우 (네트워크 오류, 서버 다운 등)
        notifyError('서버에 연결할 수 없습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.', { autoClose: 2000 });
    } else {
        // 요청 설정 중 문제 발생 또는 Axios 에러가 아닌 다른 종류의 에러
        notifyError(error.message || '알 수 없는 오류가 발생했습니다.', { autoClose: 2000 });
    }
    
    return Promise.reject(error); // 에러를 호출자(컴포넌트)에게 다시 전달
  }
);

export default axiosInstance;