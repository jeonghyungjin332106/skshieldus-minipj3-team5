// src/components/GeneratedQuestionsDisplay.jsx
import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import LoadingSpinner from './LoadingSpinner';

/**
 * 생성된 면접 질문 목록을 표시하는 컴포넌트입니다.
 * 로딩, 에러, 질문 없음, 질문 있음의 4가지 상태에 따라 다른 UI를 렌더링합니다.
 * 각 질문에 대한 복사 및 답변 입력/피드백 기능을 제공합니다.
 *
 * @param {object} props - GeneratedQuestionsDisplay 컴포넌트에 전달되는 props
 * @param {string[]} props.questions - 표시할 면접 질문 문자열 배열
 * @param {boolean} props.isLoading - 질문 생성 중 로딩 상태 여부
 * @param {string | null} props.error - 질문 생성 중 발생한 에러 메시지
 * @param {function(string): void} props.onFeedbackRequest - '답변 입력/피드백' 버튼 클릭 시 호출될 함수 (클릭된 질문을 인자로 받음)
 */
function GeneratedQuestionsDisplay({ questions, isLoading, error, onFeedbackRequest }) {
    // 복사된 질문의 ID를 저장하여 '복사됨!' 메시지를 표시
    const [copiedQuestionId, setCopiedQuestionId] = useState(null);

    // 로딩 상태일 때의 UI
    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 text-center dark:bg-gray-700 dark:text-gray-100">
                <div className="flex justify-center items-center h-48">
                    {/* 로딩 스피너 컴포넌트 사용 */}
                    <LoadingSpinner size="lg" color="purple" />
                    <p className="ml-4 text-gray-700 text-lg dark:text-gray-300">면접 질문을 생성 중입니다...</p>
                </div>
            </div>
        );
    }

    // 에러 발생 시의 UI
    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-600 dark:bg-red-900 dark:text-red-300">
                <p className="text-lg font-semibold">오류가 발생했습니다.</p>
                {/* 에러 메시지는 한 번만 출력하도록 통합 */}
                <p className="mt-2 text-sm">{error}</p>
            </div>
        );
    }

    // 생성된 질문이 없거나 비어있을 때의 UI
    if (!questions || questions.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <p className="text-lg">아직 생성된 면접 질문이 없습니다.</p>
                <p className="mt-2 text-sm">왼쪽 패널에서 회사 이름과 면접 유형을 선택하고 '면접 질문 생성 시작' 버튼을 눌러보세요.</p>
            </div>
        );
    }

    // 질문 목록이 있을 때의 UI
    return (
        <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center dark:text-gray-50">생성된 면접 질문</h2>
            <ul className="space-y-4">
                {questions.map((q, index) => (
                    <li
                        key={index} // 질문 객체에 고유 ID가 없다면 index를 사용. 가능하면 안정적인 고유 ID를 사용하는 것이 좋습니다.
                        className="border border-gray-200 rounded-md p-4 bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
                    >
                        <p className="text-lg font-semibold text-gray-800 mb-2 dark:text-gray-100">Q{index + 1}. {q}</p>
                        <div className="flex justify-end space-x-2 text-sm">
                            {/* 질문 복사 버튼 */}
                            <CopyToClipboard text={q} onCopy={() => setCopiedQuestionId(index)}>
                                <button
                                    className="text-blue-500 hover:text-blue-700 flex items-center dark:text-blue-400 dark:hover:text-blue-300"
                                    aria-label="질문 복사"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                                    </svg>
                                    {copiedQuestionId === index ? '복사됨!' : '복사'}
                                </button>
                            </CopyToClipboard>
                            {/* 답변 입력/피드백 버튼 */}
                            <button
                                onClick={() => onFeedbackRequest(q)}
                                className="text-green-500 hover:text-green-700 flex items-center dark:text-green-400 dark:hover:text-green-300"
                                aria-label="답변 입력 또는 피드백"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
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