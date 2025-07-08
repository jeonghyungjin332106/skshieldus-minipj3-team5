// src/components/ConversationListItem.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 개별 대화 목록 아이템을 렌더링하는 컴포넌트입니다.
 * 클릭 시 해당 대화 페이지로 이동하고, 삭제 버튼을 제공합니다.
 *
 * @param {object} props - ConversationListItem 컴포넌트에 전달되는 props
 * @param {object} props.conversation - 대화 데이터 객체. `_id`, `title`, `createdAt`, `summary` 등의 속성을 포함해야 합니다.
 * @param {function(string): void} props.onDelete - 대화 삭제 시 호출될 함수 (대화 ID를 인자로 받음)
 */
function ConversationListItem({ conversation, onDelete }) {
    const navigate = useNavigate();

    /**
     * 대화 아이템 클릭 시 해당 대화 상세 페이지로 이동합니다.
     */
    const handleItemClick = () => {
        navigate(`/chat/${conversation._id}`);
    };

    /**
     * 삭제 버튼 클릭 핸들러입니다.
     * 이벤트 버블링을 막고 사용자에게 확인을 받은 후 대화를 삭제합니다.
     * @param {React.MouseEvent} e - 클릭 이벤트 객체
     */
    const handleDeleteClick = (e) => {
        e.stopPropagation(); // 부모 요소(아이템 클릭)로의 이벤트 전파 방지
        if (window.confirm(`'${conversation.title}' 대화를 삭제하시겠습니까?`)) {
            onDelete(conversation._id);
        }
    };

    return (
        <div
            onClick={handleItemClick}
            // Tailwind CSS 클래스를 사용하여 스타일을 재정의하는 것이 좋습니다.
            // 예: className="cursor-pointer border border-gray-200 rounded-lg p-4 m-2 shadow-sm hover:shadow-md transition-shadow dark:border-gray-600 dark:bg-gray-800"
            style={{ cursor: 'pointer', border: '1px solid #eee', padding: '10px', margin: '5px 0' }}
        >
            <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">{conversation.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                저장 시각: {new Date(conversation.createdAt).toLocaleString()}
            </p>
            {/* 시각적 데이터 요약 부분 */}
            {conversation.summary && conversation.summary.questions && (
                <div className="text-sm text-gray-700 dark:text-gray-200">
                    <strong className="font-medium">주요 질문:</strong>{' '}
                    {conversation.summary.questions.length > 0
                        ? conversation.summary.questions.join(', ')
                        : '요약된 질문이 없습니다.'}
                </div>
            )}
            <button
                onClick={handleDeleteClick}
                // Tailwind CSS 클래스를 사용하여 스타일을 재정의하는 것이 좋습니다.
                // 예: className="mt-3 px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors dark:bg-red-700 dark:hover:bg-red-800"
                style={{ color: 'red', marginTop: '5px' }}
            >
                삭제
            </button>
        </div>
    );
}

export default ConversationListItem;