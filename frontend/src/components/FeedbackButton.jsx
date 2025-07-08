// src/components/FeedbackButton.jsx
import React, { useState } from 'react';
import { notifyInfo, notifySuccess, notifyError } from '../utils/notificationService'; // 알림 서비스 임포트

/**
 * AI 응답에 대한 사용자 피드백(도움됨/도움 안 됨)을 받는 버튼 컴포넌트입니다.
 * 피드백은 한 번만 보낼 수 있으며, 백엔드 전송을 시뮬레이션합니다.
 *
 * @param {object} props - FeedbackButton 컴포넌트에 전달되는 props
 * @param {string} props.messageId - 피드백을 보낼 메시지의 고유 ID
 * @param {function(string, 'helpful' | 'unhelpful'): void} props.onFeedbackSent - 피드백 전송 후 호출될 콜백 함수 (messageId와 피드백 타입 인자로 받음)
 * @param {boolean} props.isDarkMode - 현재 다크 모드 활성화 여부 (스타일링에 사용될 수 있음, 현재 코드에서는 직접 사용되지 않지만 prop으로 전달됨)
 */
function FeedbackButton({ messageId, onFeedbackSent, isDarkMode }) {
    // 사용자가 제출한 피드백 유형 ('helpful', 'unhelpful' 또는 null)을 저장
    const [feedbackGiven, setFeedbackGiven] = useState(null);

    /**
     * 피드백 버튼 클릭 시 호출되는 핸들러입니다.
     * 이미 피드백을 보냈다면 추가 전송을 막고, 아니면 피드백을 기록하고 시뮬레이션된 백엔드 전송을 수행합니다.
     * @param {'helpful' | 'unhelpful'} type - 사용자가 선택한 피드백 유형
     */
    const handleFeedback = (type) => {
        // 이미 피드백을 보냈다면 중복 전송 방지
        if (feedbackGiven) {
            notifyInfo('이미 피드백을 보내셨습니다.');
            return;
        }

        setFeedbackGiven(type); // 피드백 상태 업데이트

        // 실제 백엔드 API 호출 로직을 이 위치에 구현합니다.
        // 예: axios.post('/api/feedback', { messageId, type });
        console.log(`피드백 전송: Message ID=${messageId}, Type=${type}`);

        // 데모 목적으로 피드백 전송을 시뮬레이션합니다.
        setTimeout(() => {
            if (Math.random() > 0.2) { // 80% 확률로 성공
                notifySuccess('소중한 피드백 감사합니다!');
            } else { // 20% 확률로 실패
                notifyError('피드백 전송 중 오류가 발생했습니다.');
                setFeedbackGiven(null); // 실패 시 피드백 상태를 초기화하여 재시도 가능하게 함
            }
            // 부모 컴포넌트에 피드백 전송 완료를 알림
            if (onFeedbackSent) {
                onFeedbackSent(messageId, type);
            }
        }, 500); // 0.5초 지연
    };

    // 공통 버튼 및 아이콘 스타일 클래스 정의
    const buttonClass = 'p-1 rounded-full text-sm transition-colors duration-200 flex items-center';
    const iconClass = 'w-4 h-4 mr-1';

    return (
        <div className="flex space-x-2 mt-1">
            {/* '도움됨' 피드백 버튼 */}
            <button
                onClick={() => handleFeedback('helpful')}
                className={`${buttonClass} ${
                    feedbackGiven === 'helpful'
                        ? 'bg-blue-500 text-white dark:bg-blue-600' // '도움됨' 선택 시 스타일
                        : 'bg-gray-200 text-gray-700 hover:bg-blue-300 hover:text-blue-800 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-blue-700 dark:hover:text-white' // 기본 및 호버 스타일
                }`}
                disabled={!!feedbackGiven} // 피드백이 이미 전송되었으면 비활성화
                aria-label="이 답변이 도움이 되었습니다."
            >
                {/* SVG 아이콘 (엄지 척) */}
                <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414L7.586 9H4a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 001.414 1.414L10 12.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293z" clipRule="evenodd"></path>
                </svg>
                도움됨
            </button>

            {/* '도움 안 됨' 피드백 버튼 */}
            <button
                onClick={() => handleFeedback('unhelpful')}
                className={`${buttonClass} ${
                    feedbackGiven === 'unhelpful'
                        ? 'bg-red-500 text-white dark:bg-red-600' // '도움 안 됨' 선택 시 스타일
                        : 'bg-gray-200 text-gray-700 hover:bg-red-300 hover:text-red-800 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-red-700 dark:hover:text-white' // 기본 및 호버 스타일
                }`}
                disabled={!!feedbackGiven} // 피드백이 이미 전송되었으면 비활성화
                aria-label="이 답변이 도움이 되지 않았습니다."
            >
                {/* SVG 아이콘 (엄지 아래) */}
                <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.707 6.707a1 1 0 00-1.414 1.414L7.586 10l-3.293 3.293a1 1 0 101.414 1.414L10 11.414l3.293 3.293a1 1 0 001.414-1.414L12.414 10l3.293-3.293a1 1 0 00-1.414-1.414L10 8.586 6.707 5.293z" clipRule="evenodd"></path>
                </svg>
                도움 안 됨
            </button>
        </div>
    );
}

export default FeedbackButton;