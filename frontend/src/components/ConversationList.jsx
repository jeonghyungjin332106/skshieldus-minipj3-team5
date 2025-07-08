import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText, Trash2 } from 'lucide-react';

// Mock 데이터 임포트: 실제 API 연동 시에는 이 부분을 제거하고 서버에서 데이터를 가져옵니다.
import { MOCK_CONVERSATIONS } from '../mocks/data.js';

/**
 * 저장된 대화 목록을 표시하는 컴포넌트입니다.
 * 각 대화를 클릭하여 상세 보기로 이동하거나 삭제할 수 있습니다.
 */
function ConversationList() {
    const [conversations, setConversations] = useState([]);
    const navigate = useNavigate();

    // 컴포넌트 마운트 시 Mock 데이터 로드
    useEffect(() => {
        setConversations(MOCK_CONVERSATIONS);
    }, []); // 빈 배열은 컴포넌트가 처음 렌더링될 때 한 번만 실행됨을 의미합니다.

    /**
     * 대화 목록 아이템 클릭 시 해당 대화의 상세 페이지로 이동합니다.
     * @param {string} id - 클릭된 대화의 고유 ID
     */
    const handleItemClick = (id) => {
        navigate(`/chatbot/${id}`);
    };

    /**
     * 대화 삭제 버튼 클릭 시 해당 대화를 목록에서 제거합니다.
     * @param {React.MouseEvent} e - 클릭 이벤트 객체 (이벤트 버블링 방지를 위해 사용)
     * @param {string} id - 삭제할 대화의 고유 ID
     */
    const handleDelete = (e, id) => {
        e.stopPropagation(); // 부모 요소의 onClick 이벤트(handleItemClick)가 실행되는 것을 방지합니다.
        if (window.confirm('이 대화를 삭제하시겠습니까?')) {
            setConversations((prev) => prev.filter((c) => c._id !== id));
        }
    };

    // 저장된 대화가 없을 경우 표시할 UI
    if (conversations.length === 0) {
        return <p className="py-10 text-center text-gray-500 dark:text-gray-400">저장된 대화가 없습니다.</p>;
    }

    return (
        <div className="space-y-1">
            {conversations.map((conv) => (
                <div
                    key={conv._id} // 각 대화 항목의 고유 ID를 key로 사용합니다.
                    onClick={() => handleItemClick(conv._id)}
                    className="group flex cursor-pointer items-center rounded-xl p-4 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                    {/* 대화 아이콘 영역 */}
                    <div className="mr-4 flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                            <MessageSquareText className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </div>
                    </div>

                    {/* 대화 제목 및 요약 영역 */}
                    <div className="flex-grow overflow-hidden">
                        <p className="truncate text-lg font-bold text-gray-800 dark:text-gray-100">{conv.title}</p>
                        <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                            {conv.summary?.questions?.[0] || '내용 없음'}
                        </p>
                    </div>

                    {/* 시간 및 삭제 버튼 영역 */}
                    <div className="ml-4 flex h-full flex-shrink-0 flex-col items-end text-right">
                        <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                            {/* createdAt 날짜를 현지 시간으로 포맷하여 표시 */}
                            {new Date(conv.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <button
                            onClick={(e) => handleDelete(e, conv._id)}
                            className="text-gray-400 opacity-0 transition-all duration-200 hover:text-red-500 group-hover:opacity-100 dark:text-gray-500 dark:hover:text-red-500"
                            title="삭제" // 툴팁 제공
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