// /src/components/ChatWindow.jsx

import React, { useRef, useEffect } from 'react';
import FeedbackButton from './FeedbackButton'; // 피드백 버튼 임포트

// messagesEndRef를 prop으로 받도록 수정
function ChatWindow({ messages, isThinking, messagesEndRef }) { 
    // ChatWindow 내부의 messagesEndRef 정의는 제거합니다.
    // const messagesEndRef = useRef(null); // 이 줄을 제거

    // chatMessages 상태 변경 시 스크롤 (기존 로직 유지)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }, [messages]);

    return (
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-md border border-gray-200 overflow-y-auto p-4 dark:bg-gray-700 dark:border-gray-600">
            {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <p className="p-4 bg-gray-100 rounded-lg shadow-inner dark:bg-gray-600 dark:text-gray-300">
                        AI와의 대화를 시작해보세요.
                    </p>
                </div>
            ) : (
                messages.map((msg, index) => (
                    <div
                        key={msg.id || index} // 고유 ID 사용
                        className="flex flex-col mb-3"
                    >
                        <div className={`flex ${ msg.sender === 'user' ? 'justify-end' : 'justify-start' }`}>
                             <div
                                 className={`max-w-[80%] p-3 rounded-xl shadow-sm text-sm whitespace-pre-wrap break-words 
                                     ${msg.sender === 'user'
                                         ? 'bg-blue-600 text-white rounded-br-none dark:bg-blue-700'
                                         : 'bg-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-600 dark:text-gray-50'
                                     }`}
                             >
                                 {/* AI 메시지가 JSON 문자열인 경우 <pre> 태그로 렌더링 */}
                                 {msg.sender === 'ai' && msg.text && msg.text.startsWith('{') && msg.text.endsWith('}') ? (
                                     <pre className="text-base leading-relaxed font-mono overflow-auto">{msg.text}</pre>
                                 ) : (
                                     <p className="text-base leading-relaxed">{msg.text}</p>
                                 )}
                             </div>
                        </div>
                        
                        {/* AI가 보낸 메시지이고, 내용이 비어있지 않을 때만 피드백 버튼을 표시합니다. */}
                        {msg.sender === 'ai' && msg.text && (
                               <div className="flex justify-start mt-1"> {/* 마진 추가로 메시지와 버튼 분리 */}
                                   <FeedbackButton messageId={msg.id} />
                               </div>
                        )}
                    </div>
                ))
            )}

            {isThinking && (
                <div className="flex justify-start mb-3">
                    <div className="max-w-[80%] p-3 rounded-lg shadow-sm text-sm bg-gray-200 dark:bg-gray-600">
                        {/* 로딩 인디케이터 */}
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} /> {/* 스크롤을 위한 ref */}
        </div>
    );
}

export default ChatWindow;
