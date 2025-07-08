// src/components/ConversationListItem.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function ConversationListItem({ conversation, onDelete }) {
  const navigate = useNavigate();

  const handleItemClick = () => {
    navigate(`/chat/${conversation._id}`);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // 부모 요소(아이템 클릭) 이벤트 방지
    if (window.confirm(`'${conversation.title}' 대화를 삭제하시겠습니까?`)) {
      onDelete(conversation._id);
    }
  };

  return (
    <div onClick={handleItemClick} style={{ cursor: 'pointer', border: '1px solid #eee', padding: '10px', margin: '5px 0' }}>
      <h4>{conversation.title}</h4>
      <p>저장 시각: {new Date(conversation.createdAt).toLocaleString()}</p>
      {/* 요구사항에 따른 시각적 데이터 요약 부분 */}
      <div>
        <strong>주요 질문:</strong> {conversation.summary.questions.join(', ')}
      </div>
      <button onClick={handleDeleteClick} style={{ color: 'red', marginTop: '5px' }}>삭제</button>
    </div>
  );
}

export default ConversationListItem;