// src/components/ChatWindow.jsx
import React, { useRef, useEffect } from 'react';

/**
 * 채팅 메시지를 표시하는 창 컴포넌트입니다.
 * 메시지 목록을 렌더링하고, 새로운 메시지가 추가될 때 자동으로 스크롤합니다.
 *
 * @param {object} props - ChatWindow 컴포넌트에 전달되는 props
 * @param {Array<object>} props.messages - 표시할 메시지 객체 배열. 각 메시지는 `sender` ('user' 또는 'ai'), `text`, `id` (선택 사항), `timestamp` (선택 사항) 속성을 가집니다.
 * @param {boolean} props.isThinking - AI가 응답을 생성 중인지 여부를 나타내는 플래그. 로딩 인디케이터를 표시하는 데 사용됩니다.
 */
function ChatWindow({ messages, isThinking }) {
    // 메시지 목록의 끝으로 자동 스크롤하기 위한 ref
    const messagesEndRef = useRef(null);

    // messages 배열이 업데이트될 때마다 가장 최신 메시지로 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        // 채팅 창의 전체 컨테이너: 배경, 테두리, 그림자, 스크롤 가능 설정
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-md border border-gray-200 overflow-y-auto p-4
                        dark:bg-gray-700 dark:border-gray-600">
            {/* 메시지가 없을 경우 초기 안내 메시지 */}
            {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    <p className="p-4 bg-gray-100 rounded-lg shadow-inner dark:bg-gray-600 dark:text-gray-300">
                        AI와의 대화를 시작해보세요.
                    </p>
                </div>
            ) : (
                // 메시지 목록 렌더링
                messages.map((msg, index) => (
                    <div
                        // 안정적인 key를 위해 msg.id를 우선 사용하고, 없으면 index를 fallback으로 사용
                        key={msg.id || index}
                        className={`flex mb-3 ${
                            msg.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        <div
                            className={`max-w-[80%] p-3 rounded-xl shadow-sm text-sm whitespace-pre-wrap break-words
                                        ${msg.sender === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none' // 사용자 메시지 스타일
                                            : 'bg-gray-200 text-gray-800 rounded-bl-none' // AI 메시지 스타일
                                        }
                                        ${msg.sender === 'user'
                                            ? 'dark:bg-blue-700 dark:text-white' // 사용자 메시지 다크 모드
                                            : 'dark:bg-gray-600 dark:text-gray-50' // AI 메시지 다크 모드
                                        }`}
                        >
                            {/* 메시지 내용 */}
                            <p className="text-base leading-relaxed">{msg.text}</p>
                            {/* 메시지 타임스탬프 (존재할 경우) */}
                            {msg.timestamp && (
                                <span
                                    className={`block text-right text-xs mt-2 opacity-80
                                                ${msg.sender === 'user' ? 'text-blue-100 dark:text-blue-200' : 'text-gray-600 dark:text-gray-300'}`}
                                >
                                    {msg.timestamp}
                                </span>
                            )}
                        </div>
                    </div>
                ))
            )}

            {/* AI가 응답을 생성 중일 때 로딩 인디케이터 표시 */}
            {isThinking && (
                <div className="flex justify-start mb-3">
                    <div className="max-w-[80%] p-3 rounded-lg shadow-sm text-sm bg-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-600 dark:text-gray-50">
                        <span className="dot-pulse"></span> {/* 로딩 애니메이션 (CSS로 구현될 것으로 예상) */}
                    </div>
                </div>
            )}

            {/* 메시지 목록의 끝을 참조하여 자동 스크롤을 위한 빈 div */}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default ChatWindow;