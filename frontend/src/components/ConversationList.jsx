import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText, Trash2 } from 'lucide-react';

// --- 💡 1. 변수 이름을 MOCK_CONVERSATIONS 로 수정 ---
import { MOCK_CONVERSATIONS } from '../mocks/data.js';

function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // --- 💡 2. 사용하는 변수 이름도 MOCK_CONVERSATIONS 로 수정 ---
    setConversations(MOCK_CONVERSATIONS);
  }, []);

  const handleItemClick = (id) => {
    navigate(`/chatbot/${id}`);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("이 대화를 삭제하시겠습니까?")) {
        setConversations(prev => prev.filter(c => c._id !== id));
    }
  };

  if (conversations.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-10">저장된 대화가 없습니다.</p>;
  }

  return (
    <div className="space-y-1">
      {conversations.map(conv => (
        <div
          key={conv._id}
          onClick={() => handleItemClick(conv._id)}
          className="group flex items-center p-4 rounded-xl cursor-pointer transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
        >
          <div className="flex-shrink-0 mr-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <MessageSquareText className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
          
          <div className="flex-grow overflow-hidden">
            <p className="font-bold text-gray-800 dark:text-gray-100 text-lg truncate">{conv.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
              {conv.summary?.questions?.[0] || '내용 없음'}
            </p>
          </div>

          <div className="flex-shrink-0 ml-4 text-right flex flex-col items-end h-full">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">
              {new Date(conv.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <button 
                onClick={(e) => handleDelete(e, conv._id)}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200 dark:text-gray-500 dark:hover:text-red-500"
                title="삭제"
            >
                <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConversationList;