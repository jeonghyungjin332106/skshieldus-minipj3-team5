// src/components/ChatWindow.jsx
import React from 'react';

function ChatWindow({ messages, isThinking, messagesEndRef }) {
    return (
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            {messages.length === 0 && (
                <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                    <p className="p-4 bg-gray-100 rounded-lg shadow-inner">
                        AI 커리어 챗봇에게 무엇이든 물어보세요!
                    </p>
                </div>
            )}
            {messages.map((msg, index) => (
                <div
                    key={index}
                    className={`flex mb-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                        className={`relative p-4 rounded-xl max-w-xs lg:max-w-md break-words shadow-md
                                    ${msg.type === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none' // User bubble
                                        : 'bg-gray-200 text-gray-800 rounded-bl-none'}`} // AI bubble
                    >
                        <p className="text-base leading-relaxed">{msg.text}</p>
                        <span className="block text-right text-xs mt-2 opacity-80">
                            {msg.timestamp}
                        </span>
                    </div>
                </div>
            ))}
            {isThinking && (
                <div className="flex justify-start mb-4">
                    <div className="relative p-3 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none shadow-md">
                        <span className="dot-pulse"></span> {/* 로딩 애니메이션 */}
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default ChatWindow;