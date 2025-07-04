// src/components/ChatWindow.jsx
import React, { useRef, useEffect } from 'react';

// messages: [{ id: 'unique_id', sender: 'user' | 'ai', text: '메시지 내용' }] 형태
function ChatWindow({ messages }) {
  const messagesEndRef = useRef(null);

  // 새 메시지가 추가될 때마다 스크롤을 최하단으로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    // 채팅 창 컨테이너 배경, 테두리, 그림자 (다크 모드 적용)
    <div className="flex flex-col h-[500px] bg-gray-50 rounded-lg shadow-inner border border-gray-200 overflow-y-auto p-4 dark:bg-gray-800 dark:border-gray-700">
      {messages.length === 0 ? (
        // 초기 메시지 텍스트 색상 (다크 모드 적용)
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>AI와의 대화를 시작해보세요.</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex mb-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg shadow-sm text-sm ${
                msg.sender === 'user'
                  // 사용자 메시지: 배경 (다크 모드에서 약간 더 진하게), 텍스트 색상
                  ? 'bg-blue-500 text-white rounded-br-none dark:bg-blue-600'
                  // AI 메시지: 배경 (다크 모드에서 어둡게), 텍스트 색상
                  : 'bg-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-600 dark:text-gray-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))
      )}
      {/* 스크롤 위치를 위한 ref */}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatWindow;