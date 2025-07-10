import React, { useRef, useEffect } from 'react';
import FeedbackButton from './FeedbackButton';

// [수정] messagesEndRef를 prop으로 받지 않습니다.
function ChatWindow({ messages, isThinking }) { 
    // [수정] ChatWindow 내부에서 messagesEndRef를 직접 생성하고 관리합니다.
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }, [messages]);

    return (
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-md border border-gray-200 overflow-y-auto p-4 dark:bg-gray-700 dark:border-gray-600">
            {/* ... (나머지 JSX는 이전과 동일) ... */}
            {messages.map((msg, index) => (
                <div key={msg.id || index} className="flex flex-col mb-3">
                    <div className={`flex ${ msg.sender === 'user' ? 'justify-end' : 'justify-start' }`}>
                        <div className={`max-w-[80%] p-3 rounded-xl shadow-sm text-sm whitespace-pre-wrap break-words ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none dark:bg-blue-700' : 'bg-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-600 dark:text-gray-50'}`}>
                            {msg.sender === 'ai' && msg.text && (typeof msg.text === 'string' && msg.text.startsWith('{')) ? (
                                <pre className="text-base leading-relaxed font-mono overflow-auto">{msg.text}</pre>
                            ) : (
                                <p className="text-base leading-relaxed">{msg.text}</p>
                            )}
                        </div>
                    </div>
                    {msg.sender === 'ai' && msg.text && (
                        <div className="flex justify-start mt-1">
                            <FeedbackButton messageId={msg.id} />
                        </div>
                    )}
                </div>
            ))}
            {isThinking && (
                 <div className="flex justify-start mb-3">
                    <div className="max-w-[80%] p-3 rounded-lg shadow-sm text-sm bg-gray-200 dark:bg-gray-600">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                </div>
            )}
            {/* 스크롤을 위한 ref */}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default ChatWindow;