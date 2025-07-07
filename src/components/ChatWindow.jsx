// src/components/ChatWindow.jsx
import React, { useRef, useEffect } from 'react';

function ChatWindow({ messages, isThinking }) { // isThinking prop이 InterviewQuestionsPage에서도 사용되므로 명시적으로 유지
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        // 채팅 창 컨테이너 배경, 테두리, 그림자 (다크 모드 적용)
        // flex-1은 부모 요소 (main 태그) 내에서 사용 가능한 모든 공간을 차지합니다.
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-md border border-gray-200 overflow-y-auto p-4 /* ResumeAnalysisPage의 main 태그에서 p-6이 이미 적용되므로 여기서는 p-4 대신 p-0으로 줄이거나 제거할 수도 있음 */
                       dark:bg-gray-700 dark:border-gray-600">
            
            {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <p className="p-4 bg-gray-100 rounded-lg shadow-inner dark:bg-gray-600 dark:text-gray-300">
                        AI와의 대화를 시작해보세요.
                    </p>
                </div>
            ) : (
                messages.map((msg, index) => ( // index를 key로 사용하는 것은 좋지 않지만, 여기서는 간단하게 유지
                    <div
                        key={msg.id || index} // id가 없다면 index를 fallback으로 사용
                        className={`flex mb-3 ${
                            msg.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-xl shadow-sm text-sm whitespace-pre-wrap break-words
                                ${msg.sender === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none' // 사용자 메시지 스타일 (파란색, 흰색 텍스트, 오른쪽 아래 모서리 없음)
                                    : 'bg-gray-200 text-gray-800 rounded-bl-none' // AI 메시지 스타일 (회색, 어두운 텍스트, 왼쪽 아래 모서리 없음)
                                }
                                ${msg.sender === 'user'
                                    ? 'dark:bg-blue-700 dark:text-white' // 사용자 메시지 다크 모드
                                    : 'dark:bg-gray-600 dark:text-gray-50' // AI 메시지 다크 모드
                                }`}
                        >
                            {/* 메시지 내용 */}
                            <p className="text-base leading-relaxed">{msg.text}</p>
                            {/* 타임스탬프 */}
                            {/* msg.timestamp가 string인지 확인하고 렌더링. Date 객체라면 toLocaleTimeString() 호출 필요 */}
                            {msg.timestamp && (
                                <span className={`block text-right text-xs mt-2 opacity-80
                                                  ${msg.sender === 'user' ? 'text-blue-100 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {msg.timestamp}
                                </span>
                            )}
                        </div>
                    </div>
                ))
            )}

            {isThinking && (
                <div className="flex justify-start mb-3">
                    <div className="max-w-[80%] p-3 rounded-lg shadow-sm text-sm bg-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-600 dark:text-gray-50">
                        <span className="dot-pulse"></span>
                    </div>
                </div>
            )}
            
            <div ref={messagesEndRef} />
        </div>
    );
}

export default ChatWindow;