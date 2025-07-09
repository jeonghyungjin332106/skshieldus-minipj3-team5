import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText, Trash2 } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { notifyError, notifySuccess } from './Notification';
import LoadingSpinner from './LoadingSpinner';

console.log("✅ [Debug] ConversationList.jsx (ID fix version, v3) is running.");

/**
 * 저장된 대화 목록을 API를 통해 불러와 표시하는 컴포넌트입니다.
 */
function ConversationList() {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConversations = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axiosInstance.get('/chat/history');
                setConversations(response.data);
            } catch (err) {
                setError("대화 목록을 불러오는 중 오류가 발생했습니다.");
                console.error("Fetch conversations error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConversations();

    }, []);

    // [수정] _id -> id
    const handleItemClick = (id) => {
        navigate(`/chatbot/${id}`);
    };

    // [수정] _id -> id
    const handleDelete = async (e, id) => {
        e.stopPropagation();
        
        if (window.confirm('이 대화를 정말 삭제하시겠습니까?')) {
            const originalConversations = [...conversations];
            // [수정] c._id -> c.id
            setConversations(prev => prev.filter(c => c.id !== id));

            try {
                await axiosInstance.delete(`/chat/${id}`);
                notifySuccess("대화가 삭제되었습니다.");
            } catch (err) {
                notifyError("대화 삭제 중 오류가 발생했습니다.");
                setConversations(originalConversations);
                console.error("Delete conversation error:", err);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-10">
                <LoadingSpinner size="md" />
                <span className="ml-4 text-gray-500 dark:text-gray-400">대화 목록을 불러오는 중...</span>
            </div>
        );
    }

    if (error) {
        return <p className="py-10 text-center text-red-500 dark:text-red-400">{error}</p>;
    }

    if (conversations.length === 0) {
        return <p className="py-10 text-center text-gray-500 dark:text-gray-400">저장된 대화가 없습니다.</p>;
    }

    return (
        <div className="space-y-1">
            {conversations.map((conv) => (
                <div
                    // [수정] conv._id -> conv.id
                    key={conv.id}
                    onClick={() => handleItemClick(conv.id)}
                    className="group flex cursor-pointer items-center rounded-xl p-4 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                >
                    <div className="mr-4 flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                            <MessageSquareText className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </div>
                    </div>
                    <div className="flex-grow overflow-hidden">
                        <p className="truncate text-lg font-bold text-gray-800 dark:text-gray-100">{conv.title || '제목 없음'}</p>
                        <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                            {conv.summary || '요약 정보 없음'}
                        </p>
                    </div>
                    <div className="ml-4 flex h-full flex-shrink-0 flex-col items-end text-right">
                        <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                            {/* [수정] createdAt 필드명 확인 */}
                            {new Date(conv.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <button
                            // [수정] conv._id -> conv.id
                            onClick={(e) => handleDelete(e, conv.id)}
                            className="text-gray-400 opacity-0 transition-all duration-200 hover:text-red-500 group-hover:opacity-100 dark:text-gray-500 dark:hover:text-red-500"
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
