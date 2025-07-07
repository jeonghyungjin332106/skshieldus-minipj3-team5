// src/components/ChatInput.jsx
import React, { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';

function ChatInput({
    onSendMessage,
    isLoading,
    handleClearChat,
    handleExampleQuestionClick,
    exampleQuestions,
}) {
    const [currentMessage, setCurrentMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (currentMessage.trim() === '') return;
        onSendMessage(currentMessage);
        setCurrentMessage('');
    };

    const handleExampleClick = (question) => {
        setCurrentMessage(question);
        // 여기서 바로 메시지를 전송하고 싶다면, onSendMessage(question);을 호출할 수 있습니다.
        // 현재는 입력 필드만 채웁니다. 클릭 시 즉시 전송을 원한다면 InterviewQuestionsPage에서 handleExampleQuestionClick prop을 onSendMessage로 직접 연결했으므로
        // 이 함수는 단순히 currentMessage만 설정하면 됩니다. 실제 전송은 부모에게 위임됩니다.
        // 하지만 UX상 예시 질문 클릭시 바로 전송되는 것이 자연스러우므로 handleExampleQuestionClick prop을 사용합니다.
        handleExampleQuestionClick(question); // 부모로부터 받은 함수 호출 (바로 전송 로직이 연결되어있음)
        setCurrentMessage(''); // 입력 필드 초기화
    };

    // 다크 모드 스타일을 위한 클래스 변수
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
                {exampleQuestions && exampleQuestions.length > 0 && (
                    <div className="w-full">
                        <p className="text-sm font-semibold text-gray-700 mb-2 dark:text-gray-200">질문 예시:</p>
                        <div className="flex flex-wrap gap-2">
                            {exampleQuestions.map((q, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleExampleClick(q)} // 이 함수가 부모의 handleExampleQuestionClick을 호출하여 메시지를 전송합니다.
                                    className={exampleButtonClassName}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="AI 챗봇에게 질문하세요..."
                        className={inputClassName}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className={submitButtonClassName}
                        disabled={isLoading}
                    >
                        <span className="flex items-center justify-center">
                            <Send size={18} className="mr-2" /> 전송
                        </span>
                    </button>
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