// src/components/FeedbackModal.jsx
import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

function FeedbackModal({ isOpen, onClose, question, onSubmitAnswer, isLoadingFeedback, feedbackResult, feedbackError }) {
  const [userAnswer, setUserAnswer] = useState('');

  if (!isOpen) return null; // 모달이 열려 있지 않으면 아무것도 렌더링하지 않음

  const handleSubmit = () => {
    if (userAnswer.trim() === '') {
      alert('답변을 입력해주세요.');
      return;
    }
    onSubmitAnswer(question, userAnswer); // 부모 컴포넌트로 질문과 답변 전달
  };

  const handleClose = () => {
    setUserAnswer(''); // 모달 닫을 때 답변 초기화
    onClose();
  };

  return (
    // 모달 오버레이 배경 (다크 모드 적용)
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 dark:bg-gray-900 dark:bg-opacity-75">
      {/* 모달 내용 박스 배경 및 그림자 (다크 모드 적용) */}
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl mx-4 relative dark:bg-gray-800">
        {/* 제목 텍스트 색상 및 하단 보더 색상 (다크 모드 적용) */}
        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 dark:text-gray-50 dark:border-gray-600">
          답변 입력 및 피드백
        </h2>
        {/* 닫기 버튼 텍스트 색상 (다크 모드 적용) */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl leading-none dark:text-gray-400 dark:hover:text-gray-200"
        >
          &times; {/* 닫기 버튼 */}
        </button>

        {/* 질문 표시 섹션 */}
        <div className="mb-6">
          {/* 질문 라벨 텍스트 색상 (다크 모드 적용) */}
          <p className="font-semibold text-lg text-gray-700 mb-2 dark:text-gray-300">질문:</p>
          {/* 질문 내용 박스 배경, 테두리, 텍스트 색상 (다크 모드 적용) */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200">
            {question || "질문 내용이 없습니다."}
          </div>
        </div>

        {/* 답변 입력 필드 섹션 */}
        <div className="mb-6">
          {/* 라벨 텍스트 색상 (다크 모드 적용) */}
          <label htmlFor="user-answer" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
            당신의 답변을 입력해주세요:
          </label>
          <textarea
            id="user-answer"
            // 입력 필드 스타일 (다크 모드 적용)
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y min-h-[120px] dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
            placeholder="여기에 답변을 입력하세요..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={isLoadingFeedback}
          ></textarea>
        </div>

        {/* 답변 제출 버튼 (스타일 유지 - 자주 사용되는 색상) */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-md transition-colors duration-300"
            disabled={isLoadingFeedback}
          >
            {isLoadingFeedback ? '피드백 요청 중...' : '답변 제출 및 피드백 요청'}
          </button>
        </div>

        {/* 피드백 결과 표시 섹션 */}
        {isLoadingFeedback ? (
          <div className="text-center mt-4">
            <LoadingSpinner size="md" color="purple" /> {/* 스피너 색상은 prop으로 결정됨 */}
            {/* 로딩 메시지 텍스트 색상 (다크 모드 적용) */}
            <p className="mt-2 text-gray-700 dark:text-gray-300">피드백을 생성 중입니다...</p>
          </div>
        ) : feedbackError ? (
          {/* 에러 메시지 박스 배경, 테두리, 텍스트 색상 (다크 모드 적용) */}
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
            <strong className="font-bold">피드백 오류:</strong>
            <span className="block sm:inline ml-2">{feedbackError}</span>
          </div>
        ) : feedbackResult ? (
          <div className="mt-6 border-t pt-4 dark:border-gray-600"> {/* 상단 보더 색상 */}
            {/* 제목 텍스트 색상 (다크 모드 적용) */}
            <h3 className="text-xl font-semibold text-gray-800 mb-3 dark:text-gray-100">AI 피드백:</h3>
            {/* 피드백 내용 박스 배경, 텍스트 색상 (다크 모드 적용) */}
            <div className="bg-gray-100 p-4 rounded-md text-gray-800 leading-relaxed max-h-60 overflow-y-auto dark:bg-gray-700 dark:text-gray-200">
              {feedbackResult.summary && <p className="mb-2"><strong>요약:</strong> {feedbackResult.summary}</p>}
              {feedbackResult.suggestions && (
                <div className="mb-2">
                  <strong>개선 제안:</strong>
                  {/* 리스트 아이템 텍스트 색상 (다크 모드 적용) */}
                  <ul className="list-disc list-inside ml-4 dark:text-gray-200">
                    {feedbackResult.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feedbackResult.overallScore && <p><strong>전반적인 점수:</strong> {feedbackResult.overallScore}/5</p>}
              {!feedbackResult.summary && !feedbackResult.suggestions && !feedbackResult.overallScore && (
                <p>{feedbackResult}</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default FeedbackModal;