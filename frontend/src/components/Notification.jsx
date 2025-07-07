// src/components/Notification.jsx
// 이 파일은 UI를 렌더링하지 않고, 알림 헬퍼 함수들을 export 합니다.
import { toast } from 'react-toastify';

// 기본 토스트 옵션 설정
const defaultOptions = {
  position: "top-right", // 알림 위치 기본값
  autoClose: 3000,       // 3초 후 자동 닫힘 기본값
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// 성공 알림
export const notifySuccess = (message, options = {}) => {
  toast.success(message, { ...defaultOptions, ...options });
};

// 에러 알림
export const notifyError = (message, options = {}) => {
  toast.error(message, { ...defaultOptions, ...options });
};

// 정보 알림
export const notifyInfo = (message, options = {}) => {
  toast.info(message, { ...defaultOptions, ...options });
};

// 경고 알림
export const notifyWarn = (message, options = {}) => {
  toast.warn(message, { ...defaultOptions, ...options });
};

// 일반 토스트 (타입 지정 가능)
export const notify = (message, type = 'default', options = {}) => {
  switch (type) {
    case 'success':
      notifySuccess(message, options);
      break;
    case 'error':
      notifyError(message, options);
      break;
    case 'info':
      notifyInfo(message, options);
      break;
    case 'warn':
      notifyWarn(message, options);
      break;
    default:
      toast(message, { ...defaultOptions, ...options });
  }
};