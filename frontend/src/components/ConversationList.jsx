// src/components/ConversationList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareText, Trash2 } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { notifyError, notifySuccess } from './Notification';
import LoadingSpinner from './LoadingSpinner'; // LoadingSpinner 임포트 추가

/**
 * 저장된 대화 목록을 API를 통해 불러와 표시하는 컴포넌트입니다.
 */
function ConversationList() {
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // 시간 포맷팅 헬퍼 함수
    const formatTime = (isoString) => {
        // isoString이 유효한지 먼저 확인합니다.
        if (!isoString) {
            return "시간 정보 없음";
        }

        try {
            let processedString = isoString;

            // 백엔드에서 ' ' 대신 'T'를 사용하므로 이 변환은 대부분 불필요하지만,
            // 혹시 모를 이전 형식에 대한 호환성을 위해 유지할 수 있습니다.
            if (processedString.includes(' ')) {
                processedString = processedString.replace(' ', 'T');
            }
            
            // 백엔드에서 +09:00 오프셋을 포함하여 보내므로, Date 객체가 이를 정확히 파싱합니다.
            const date = new Date(processedString); 
            
            if (isNaN(date.getTime())) { // "Invalid Date"인지 확인
                throw new Error("Invalid Date generated from: " + processedString);
            }

            // [핵심 수정]: Date 객체에 명시적으로 9시간을 더합니다.
            // 백엔드에서 KST 시간을 보내지만 프론트에서 9시간 당겨지는 현상을 해결하기 위함입니다.
            date.setHours(date.getHours() + 9); 

            // 한국 시간대로 명시적으로 설정하여 표시합니다.
            return date.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit', 
                // second: '2-digit', // 초까지 표시하고 싶다면 주석을 해제하세요.
                hour12: false // 24시간 형식으로 표시 (오전/오후 제거)
            });
        } catch (e) {
            // console.error("Error formatting time:", isoString, e); // 오류 로깅 제거
            return "시간 정보 없음";
        }
    };

    // 요약 질문을 안전하게 가져오는 함수
    const getSummaryQuestions = (summary) => {
        if (summary && summary.questions && Array.isArray(summary.questions)) {
            return summary.questions.length > 0
                ? summary.questions.join(', ')
                : '요약된 질문이 없습니다.';
        }
        return '요약된 질문이 없습니다.'; // summary 또는 questions 필드가 없는 경우
    };


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

    const handleItemClick = (id) => {
        navigate(`/chatbot/${id}`);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        
        if (window.confirm('이 대화를 정말 삭제하시겠습니까?')) {
            const originalConversations = [...conversations];
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
                    key={conv.id} // [수정]: conv.id 사용 (원본 DTO에 맞춰)
                    onClick={() => handleItemClick(conv.id)} // [수정]: conv.id 사용 (원본 DTO에 맞춰)
                    className="group flex cursor-pointer items-center rounded-xl p-4 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 mb-2"
                >
                    <div className="mr-4 flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                            <MessageSquareText className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                        </div>
                    </div>
                    <div className="flex-grow overflow-hidden">
                        <p className="truncate text-lg font-bold text-gray-800 dark:text-gray-100">{conv.title || '제목 없음'}</p>
                        <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                            {getSummaryQuestions(conv.summary)}
                        </p>
                    </div>
                    <div className="ml-4 flex h-full flex-shrink-0 flex-col items-end text-right">
                        <p className="mb-1 text-xs text-gray-400 dark:text-gray-500">
                            {formatTime(conv.createdAt)} {/* [수정]: conv.createdAt 사용 (원본 DTO에 맞춰) */}
                        </p>
                        <button
                            onClick={(e) => handleDelete(e, conv.id)} // [수정]: conv.id 사용 (원본 DTO에 맞춰)
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
