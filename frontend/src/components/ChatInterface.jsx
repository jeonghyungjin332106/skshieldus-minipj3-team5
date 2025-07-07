// src/components/ChatInterface.jsx
import React from 'react';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';

function ChatInterface({
    messages,
    isThinking,
    messagesEndRef,
    currentMessage,
    setCurrentMessage,
    handleSendMessage,
    handleClearChat,
    handleExampleQuestionClick,
    exampleQuestions,
}) {
    return (
        <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200
                           dark:bg-gray-700 dark:border-gray-600"> {/* 다크 모드 배경 및 테두리 추가 */}
            {/* 채팅 메시지 표시 영역 */}
            <ChatWindow
                messages={messages}
                isThinking={isThinking}
                messagesEndRef={messagesEndRef}
            />

            {/* 챗봇 입력 필드 및 컨트롤 버튼 */}
            {/* ChatInput 컴포넌트 자체에 다크 모드 스타일이 적용되어 있다면, 여기서는 추가적인 변경 필요 없음 */}
            <ChatInput
                currentMessage={currentMessage}
                setCurrentMessage={setCurrentMessage}
                isThinking={isThinking}
                handleSendMessage={handleSendMessage}
                handleClearChat={handleClearChat}
                handleExampleQuestionClick={handleExampleQuestionClick}
                exampleQuestions={exampleQuestions}
            />
        </main>
    );
}

export default ChatInterface;