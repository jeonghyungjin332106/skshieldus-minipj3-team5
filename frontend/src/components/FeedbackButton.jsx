// src/components/FeedbackButton.jsx
import React, { useState } from 'react';
import { notifyInfo, notifySuccess, notifyError } from '../utils/notificationService'; // 알림 서비스 임포트

function FeedbackButton({ messageId, onFeedbackSent, isDarkMode }) {
  const [feedbackGiven, setFeedbackGiven] = useState(null); // 'helpful', 'unhelpful'

  const handleFeedback = (type) => {
    if (feedbackGiven) { // 이미 피드백을 보냈다면 다시 보내지 않음
      notifyInfo('이미 피드백을 보내셨습니다.');
      return;
    }
    setFeedbackGiven(type);
    
    // 실제로는 여기에 백엔드 API 호출 로직이 들어갑니다.
    // messageId와 type (helpful/unhelpful)을 백엔드로 전송
    console.log(`피드백 전송: Message ID=${messageId}, Type=${type}`);
    
    setTimeout(() => { // 데모용 시뮬레이션
      if (Math.random() > 0.2) { // 80% 확률로 성공
        notifySuccess('소중한 피드백 감사합니다!');
      } else {
        notifyError('피드백 전송 중 오류가 발생했습니다.');
        setFeedbackGiven(null); // 실패 시 피드백 상태 초기화
      }
      if (onFeedbackSent) {
        onFeedbackSent(messageId, type); // 부모 컴포넌트에 피드백 전송 알림
      }
    }, 500); // 0.5초 지연
  };

  const buttonClass = "p-1 rounded-full text-sm transition-colors duration-200 flex items-center";
  const iconClass = "w-4 h-4 mr-1";

  return (
    <div className="flex space-x-2 mt-1">
      <button
        onClick={() => handleFeedback('helpful')}
        className={`${buttonClass} ${
          feedbackGiven === 'helpful'
            ? 'bg-blue-500 text-white dark:bg-blue-600'
            : 'bg-gray-200 text-gray-700 hover:bg-blue-300 hover:text-blue-800 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-blue-700 dark:hover:text-white'
        }`}
        disabled={!!feedbackGiven} // 피드백이 이미 전송되었으면 비활성화
        aria-label="이 답변이 도움이 되었습니다."
      >
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414L7.586 9H4a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 001.414 1.414L10 12.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293z" clipRule="evenodd"></path></svg>
        도움됨
      </button>
      <button
        onClick={() => handleFeedback('unhelpful')}
        className={`${buttonClass} ${
          feedbackGiven === 'unhelpful'
            ? 'bg-red-500 text-white dark:bg-red-600'
            : 'bg-gray-200 text-gray-700 hover:bg-red-300 hover:text-red-800 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-red-700 dark:hover:text-white'
        }`}
        disabled={!!feedbackGiven}
        aria-label="이 답변이 도움이 되지 않았습니다."
      >
        <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.707 6.707a1 1 0 00-1.414 1.414L7.586 10l-3.293 3.293a1 1 0 101.414 1.414L10 11.414l3.293 3.293a1 1 0 001.414-1.414L12.414 10l3.293-3.293a1 1 0 00-1.414-1.414L10 8.586 6.707 5.293z" clipRule="evenodd"></path></svg>
        도움 안 됨
      </button>
    </div>
  );
}

export default FeedbackButton;