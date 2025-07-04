// src/components/ChatInput.jsx
import React, { useState } from 'react';

function ChatInput({ onSendMessage, isLoading }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() !== '') {
      onSendMessage(message);
      setMessage(''); // 메시지 전송 후 입력 필드 초기화
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex mt-4">
      <textarea
        // 텍스트 영역 스타일 (다크 모드 적용)
        className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 overflow-y-auto
                   dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 dark:placeholder-gray-400"
        placeholder={isLoading ? "AI 응답 대기 중..." : "메시지를 입력하세요..."}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={1}
        disabled={isLoading}
        onKeyPress={(e) => {
          // Shift + Enter는 줄바꿈, Enter만 누르면 전송 (메시지가 비어있지 않고 로딩 중이 아닐 때)
          if (e.key === 'Enter' && !e.shiftKey && message.trim() !== '' && !isLoading) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      ></textarea>
      <button
        type="submit"
        // 버튼 스타일 (다크 모드 적용)
        className="bg-blue-500 text-white px-6 py-3 rounded-r-lg hover:bg-blue-600 transition-colors duration-300 font-semibold
                   dark:bg-blue-700 dark:hover:bg-blue-800"
        disabled={isLoading || message.trim() === ''}
      >
        전송
      </button>
    </form>
  );
}

export default ChatInput;