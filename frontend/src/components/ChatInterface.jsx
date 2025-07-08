// src/components/ChatInterface.jsx
import React from 'react';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';

/**
 * 전체 채팅 인터페이스를 렌더링하는 컴포넌트입니다.
 * 채팅 메시지 창과 메시지 입력 필드를 포함합니다.
 *
 * @param {object} props - ChatInterface 컴포넌트에 전달되는 props
 * @param {Array<object>} props.messages - 표시할 메시지 배열 (예: [{ sender: 'user', text: 'Hello' }])
 * @param {boolean} props.isThinking - AI가 응답을 생각 중인지 여부 (로딩 상태)
 * @param {React.RefObject<HTMLDivElement>} props.messagesEndRef - 메시지 스크롤을 위한 참조 객체
 * @param {string} props.currentMessage - 현재 입력 필드에 있는 메시지 텍스트
 * @param {function(string): void} props.setCurrentMessage - 현재 메시지 상태를 업데이트하는 함수
 * @param {function(string): void} props.handleSendMessage - 메시지 전송 시 호출될 함수
 * @param {function(): void} props.handleClearChat - 채팅 초기화 버튼 클릭 시 호출될 함수
 * @param {function(string): void} props.handleExampleQuestionClick - 예시 질문 클릭 시 호출될 함수
 * @param {string[]} props.exampleQuestions - ChatInput에 표시할 예시 질문 배열
 */
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
        <main
            className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200
                       dark:bg-gray-700 dark:border-gray-600"
        >
            {/* 채팅 메시지 표시 영역 */}
            <ChatWindow
                messages={messages}
                isThinking={isThinking}
                messagesEndRef={messagesEndRef}
            />

            {/* 챗봇 입력 필드 및 컨트롤 버튼 */}
            <ChatInput
                currentMessage={currentMessage}
                setCurrentMessage={setCurrentMessage}
                isThinking={isThinking}
                onSendMessage={handleSendMessage} // prop 이름을 ChatInput에 맞게 onSendMessage로 변경
                handleClearChat={handleClearChat}
                handleExampleQuestionClick={handleExampleQuestionClick}
                exampleQuestions={exampleQuestions}
            />
        </main>
    );
}

export default ChatInterface;