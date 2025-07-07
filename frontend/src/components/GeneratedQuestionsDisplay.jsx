// src/components/GeneratedQuestionsDisplay.jsx
import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import LoadingSpinner from './LoadingSpinner'; // ⭐️ LoadingSpinner 컴포넌트 임포트 ⭐️

function GeneratedQuestionsDisplay({ questions, isLoading, error, onFeedbackRequest }) {
  const [copiedQuestionId, setCopiedQuestionId] = useState(null);

  if (isLoading) {
    return (
      // 로딩 중 컨테이너 배경 및 텍스트 색상 (다크 모드 적용)
      <div className="bg-white rounded-lg shadow-md p-6 text-center dark:bg-gray-700 dark:text-gray-100">
        <div className="flex justify-center items-center h-48">
          {/* ⭐️⭐️⭐️ SVG 스피너 대신 LoadingSpinner 컴포넌트 사용 ⭐️⭐️⭐️ */}
          <LoadingSpinner size="lg" color="purple" /> {/* h-10 w-10에 맞춰 'lg' 사이즈, 색상은 'purple' */}
          {/* ---------------------------------------------------- */}
          {/* 로딩 메시지 텍스트 색상 (다크 모드 적용) */}
          <p className="ml-4 text-gray-700 text-lg dark:text-gray-300">면접 질문을 생성 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      // 에러 컨테이너 배경 및 텍스트 색상 (다크 모드 적용)
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-600 dark:bg-red-900 dark:text-red-300">
        {/* 에러 메시지 텍스트 색상 */}
        <p className="text-lg font-semibold">{error}</p>
        <p className="mt-2 text-sm">{error}</p> {/* error 메시지가 두 번 출력되므로 하나로 합치거나 명확화 */}
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      // 질문 없을 때 컨테이너 배경 및 텍스트 색상 (다크 모드 적용)
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        {/* 메시지 텍스트 색상 */}
        <p className="text-lg">아직 생성된 면접 질문이 없습니다.</p>
        <p className="mt-2 text-sm">왼쪽 패널에서 회사 이름과 면접 유형을 선택하고 '면접 질문 생성 시작' 버튼을 눌러보세요.</p>
      </div>
    );
  }

  return (
    // 질문 목록 컨테이너 배경 및 그림자 (다크 모드 적용)
    <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-700">
      {/* 제목 텍스트 색상 (다크 모드 적용) */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center dark:text-gray-50">생성된 면접 질문</h2>
      <ul className="space-y-4">
        {questions.map((q, index) => (
          // 각 질문 아이템 배경, 테두리 (다크 모드 적용)
          <li key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50 dark:border-gray-600 dark:bg-gray-800">
            {/* 질문 텍스트 색상 (다크 모드 적용) */}
            <p className="text-lg font-semibold text-gray-800 mb-2 dark:text-gray-100">Q{index + 1}. {q}</p>
            <div className="flex justify-end space-x-2 text-sm">
              <CopyToClipboard text={q} onCopy={() => setCopiedQuestionId(index)}>
                {/* 복사 버튼 텍스트 색상 (다크 모드 적용) */}
                <button className="text-blue-500 hover:text-blue-700 flex items-center dark:text-blue-400 dark:hover:text-blue-300">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  {copiedQuestionId === index ? '복사됨!' : '복사'}
                </button>
              </CopyToClipboard>
              {/* 답변 입력/피드백 버튼 텍스트 색상 (다크 모드 적용) */}
              <button
                onClick={() => onFeedbackRequest(q)}
                className="text-green-500 hover:text-green-700 flex items-center dark:text-green-400 dark:hover:text-green-300"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                답변 입력/피드백
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GeneratedQuestionsDisplay;