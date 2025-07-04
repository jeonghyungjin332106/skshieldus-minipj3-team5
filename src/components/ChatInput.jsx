// src/components/ChatInput.jsx
import React from 'react';
import { Send, Trash2 } from 'lucide-react'; // 아이콘 임포트

function ChatInput({
    currentMessage,
    setCurrentMessage,
    isThinking,
    handleSendMessage,
    handleClearChat,
    handleExampleQuestionClick,
    exampleQuestions,
}) {
    return (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex flex-col space-y-3">
                {/* 질문 예시 버튼 섹션 */}
                <div className="w-full">
                    <p className="text-sm font-semibold text-gray-700 mb-2">질문 예시:</p>
                    <div className="flex flex-wrap gap-2">
                        {exampleQuestions.map((q, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleExampleQuestionClick(q)}
                                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors duration-200 border border-blue-300"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        placeholder="AI 챗봇에게 질문하세요..."
                        className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        disabled={isThinking}
                    />
                    <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 shadow-md"
                        disabled={isThinking}
                    >
                        <span className="flex items-center justify-center">
                            <Send size={18} className="mr-2" /> 전송
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={handleClearChat}
                        className="px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 transform hover:scale-105 shadow-md"
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