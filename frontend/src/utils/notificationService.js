// src/utils/notificationService.js

// 알림을 표시하는 기본 함수 (콘솔에 출력)
export const notifyInfo = (message) => {
  console.log(`[INFO] ${message}`);
  // 실제 알림 라이브러리(예: react-toastify)를 사용한다면 여기에 해당 코드를 작성합니다.
  // 예: toast.info(message);
};

// 성공 알림 함수
export const notifySuccess = (message) => {
  console.log(`[SUCCESS] ${message}`);
  // 예: toast.success(message);
};

// 오류 알림 함수
export const notifyError = (message) => {
  console.error(`[ERROR] ${message}`);
  // 예: toast.error(message);
};

// 추가적으로 필요한 다른 알림 함수들을 여기에 정의할 수 있습니다.