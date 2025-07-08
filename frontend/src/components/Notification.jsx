// src/components/Notification.jsx
// 이 파일은 UI를 렌더링하지 않고, React-Toastify를 사용하여 알림 헬퍼 함수들을 제공합니다.
import { toast } from 'react-toastify';

/**
 * 모든 토스트 알림에 공통으로 적용될 기본 옵션들을 정의합니다.
 * 이 옵션들은 각 `notify` 함수 호출 시 `options` 인자로 덮어쓸 수 있습니다.
 */
const defaultOptions = {
    position: 'top-right',      // 알림이 화면에 표시될 기본 위치 (예: 'top-left', 'top-center', 'bottom-right' 등)
    autoClose: 3000,            // 알림이 자동으로 닫히기까지의 시간 (밀리초), 0으로 설정하면 자동 닫히지 않음. 기본 3초
    hideProgressBar: false,     // 알림 하단에 진행률 바 표시 여부
    closeOnClick: true,         // 알림 영역 클릭 시 알림 닫힘 여부
    pauseOnHover: true,         // 마우스 호버 시 자동 닫힘 타이머 일시 정지 여부
    draggable: true,            // 알림을 드래그하여 이동할 수 있는지 여부
    progress: undefined,        // 사용자 정의 진행률 컴포넌트 (기본값은 undefined로 진행률 바 사용)
    // theme: 'light',          // 기본 테마 (라이트, 다크). App.jsx의 ToastContainer에서 동적으로 설정하는 것이 일반적
};

/**
 * 성공(Success) 메시지 알림을 사용자에게 표시합니다.
 * 주로 성공적인 작업 완료를 알릴 때 사용됩니다.
 * @param {string} message - 사용자에게 표시할 성공 메시지입니다.
 * @param {object} [options={}] - `defaultOptions`를 덮어쓸 수 있는 추가 `react-toastify` 옵션 객체입니다.
 */
export const notifySuccess = (message, options = {}) => {
    toast.success(message, { ...defaultOptions, ...options });
};

/**
 * 오류(Error) 메시지 알림을 사용자에게 표시합니다.
 * 주로 작업 실패나 예상치 못한 문제가 발생했을 때 사용됩니다.
 * @param {string} message - 사용자에게 표시할 오류 메시지입니다.
 * @param {object} [options={}] - `defaultOptions`를 덮어쓸 수 있는 추가 `react-toastify` 옵션 객체입니다.
 */
export const notifyError = (message, options = {}) => {
    toast.error(message, { ...defaultOptions, ...options });
};

/**
 * 정보(Info) 메시지 알림을 사용자에게 표시합니다.
 * 중요하지 않지만 사용자에게 특정 정보를 전달해야 할 때 사용됩니다.
 * @param {string} message - 사용자에게 표시할 정보 메시지입니다.
 * @param {object} [options={}] - `defaultOptions`를 덮어쓸 수 있는 추가 `react-toastify` 옵션 객체입니다.
 */
export const notifyInfo = (message, options = {}) => {
    toast.info(message, { ...defaultOptions, ...options });
};

/**
 * 경고(Warning) 메시지 알림을 사용자에게 표시합니다.
 * 잠재적인 문제나 주의를 요하는 상황을 알릴 때 사용됩니다.
 * @param {string} message - 사용자에게 표시할 경고 메시지입니다.
 * @param {object} [options={}] - `defaultOptions`를 덮어쓸 수 있는 추가 `react-toastify` 옵션 객체입니다.
 */
export const notifyWarn = (message, options = {}) => {
    toast.warn(message, { ...defaultOptions, ...options });
};

/**
 * 지정된 타입에 따라 다양한 종류의 토스트 알림을 표시하는 범용 함수입니다.
 * 이 함수를 통해 알림 타입을 동적으로 선택하여 표시할 수 있습니다.
 * @param {string} message - 사용자에게 표시할 메시지입니다.
 * @param {'default' | 'success' | 'error' | 'info' | 'warn'} [type='default'] - 알림의 시각적 타입입니다.
 * @param {object} [options={}] - `defaultOptions`를 덮어쓸 수 있는 추가 `react-toastify` 옵션 객체입니다.
 */
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
        default: // 'default' 타입이거나 알 수 없는 타입일 경우 일반 토스트 표시
            toast(message, { ...defaultOptions, ...options });
    }
};