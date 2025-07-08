// src/components/ChatInput.jsx
import React, { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';

/**
 * 챗봇 입력 컴포넌트입니다. 사용자 메시지 입력, 전송, 채팅 초기화, 예시 질문 기능을 제공합니다.
 *
 * @param {object} props - ChatInput 컴포넌트에 전달되는 props
 * @param {function(string): void} props.onSendMessage - 메시지 전송 시 호출될 함수
 * @param {boolean} props.isLoading - 메시지 전송 중 로딩 상태 여부
 * @param {function(): void} props.handleClearChat - 채팅 초기화 버튼 클릭 시 호출될 함수
 * @param {function(string): void} props.handleExampleQuestionClick - 예시 질문 클릭 시 호출될 함수 (메시지 전송 로직 포함)
 * @param {string[]} props.exampleQuestions - 표시할 예시 질문 배열
 */
function ChatInput({
    onSendMessage,
    isLoading,
    handleClearChat,
    handleExampleQuestionClick,
    exampleQuestions,
}) {
    const [currentMessage, setCurrentMessage] = useState('');

    /**
     * 메시지 전송 폼 제출 핸들러입니다.
     * @param {React.FormEvent} e - 폼 제출 이벤트 객체
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentMessage.trim() === '') return;
        onSendMessage(currentMessage);
        setCurrentMessage('');
    };

    /**
     * 예시 질문 클릭 핸들러입니다. 클릭된 질문으로 입력 필드를 채우고 즉시 메시지를 전송합니다.
     * @param {string} question - 클릭된 예시 질문 텍스트
     */
    const handleExampleClick = (question) => {
        // 입력 필드에 질문을 설정하고 부모로부터 받은 함수를 호출하여 메시지를 전송합니다.
        handleExampleQuestionClick(question);
        setCurrentMessage(''); // 입력 필드 초기화
    };

    // 다크 모드와 일반 모드를 위한 Tailwind CSS 클래스 변수 정의
    const inputClassName = `flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm
                             dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100`;
    const submitButtonClassName = `px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 shadow-md
                                   dark:bg-blue-700 dark:hover:bg-blue-800`;
    const clearButtonClassName = `px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 transform hover:scale-105 shadow-md
                                  dark:bg-red-700 dark:hover:bg-red-800`;
    const exampleButtonClassName = `px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors duration-200 border border-blue-300
                                    dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-900 dark:border-blue-700`;

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl dark:border-gray-600 dark:bg-gray-700">
            <div className="flex flex-col space-y-3">
                {/* 예시 질문이 있을 경우에만 렌더링 */}
                {exampleQuestions && exampleQuestions.length > 0 && (
                    <div className="w-full">
                        <p className="text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">질문 예시:</p>
                        <div className="flex flex-wrap gap-2">
                            {exampleQuestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleExampleClick(q)}
                                    className={exampleButtonClassName}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-3">
                    {/* 메시지 입력 필드 */}
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="AI 챗봇에게 질문하세요..."
                        className={inputClassName}
                        disabled={isLoading}
                    />
                    {/* 메시지 전송 버튼 */}
                    <button
                        type="submit"
                        className={submitButtonClassName}
                        disabled={isLoading}
                    >
                        <span className="flex items-center justify-center">
                            <Send size={18} className="mr-2" /> 전송
                        </span>
                    </button>
                    {/* 채팅 초기화 버튼 */}
                    <button
                        type="button"
                        onClick={handleClearChat}
                        className={clearButtonClassName}
                    >
                        <span className="flex items-center justify-center">
                            <Trash2 size={18} className="mr-1" /> 채팅 초기화
                        </span>
                    </button>
                </div>
            </div>
        </form>
    );
}

export default ChatInput;