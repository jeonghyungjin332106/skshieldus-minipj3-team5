import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import ResumeUploadSection from '../components/ResumeUploadSection';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import { addUserMessage, addAiMessage, setMessages, clearChat, setAiTyping } from '../features/chat/chatSlice';
import axiosInstance from '../utils/axiosInstance';
import { MOCK_CONVERSATIONS } from '../mocks/data.js';

function ChatbotPage() {
    const { id: urlId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { messages, isAiTyping } = useSelector((state) => state.chat);
    const [pageTitle, setPageTitle] = useState("AI 커리어 챗봇");

    useEffect(() => {
        // 페이지를 벗어날 때 Redux의 채팅 상태를 깨끗하게 정리합니다.
        return () => {
            dispatch(clearChat());
        };
    }, [dispatch]);
    
    useEffect(() => {
        const fetchConversationById = async (id) => {
            dispatch(setAiTyping(true));
            try {
                let loadedData;
                if (import.meta.env.DEV) {
                    console.log(`ChatbotPage: 개발 모드이므로 ID(${id})에 해당하는 목업 데이터를 찾습니다.`);
                    loadedData = MOCK_CONVERSATIONS.find(conv => conv._id === id);
                } else {
                    const response = await axiosInstance.get(`/chat/${id}`);
                    loadedData = response.data;
                }

                if (loadedData) {
                    const formattedMessages = loadedData.chatHistory.map(msg => ({
                        sender: msg.role === 'assistant' ? 'ai' : 'user', text: msg.content
                    }));
                    dispatch(setMessages(formattedMessages));
                    setPageTitle(loadedData.title);
                } else {
                    navigate('/history');
                }
            } catch (error) {
                console.error("Error fetching conversation:", error);
                navigate('/history');
            } finally {
                dispatch(setAiTyping(false));
            }
        };

        if (urlId) {
            fetchConversationById(urlId);
        } else {
            dispatch(clearChat());
            dispatch(addAiMessage('안녕하세요! AI 커리어 챗봇입니다. 무엇을 도와드릴까요?'));
            setPageTitle("AI 커리어 챗봇 (새 대화)");
        }
    }, [urlId, navigate, dispatch]);

    /**
     * [수정됨] axiosInstance를 사용하여 실제 채팅 API를 호출합니다.
     */
    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || isAiTyping) return;
        dispatch(addUserMessage(messageText));
        
        try {
            // axiosInstance를 사용하여 API 호출 (baseURL, 헤더 등 자동 적용)
            const response = await axiosInstance.post('/chat/send', {
                message: messageText,
            });
            
            // 백엔드 응답에서 실제 AI 답변 추출
            const aiResponse = response.data.message;
            dispatch(addAiMessage(aiResponse));

        } catch (error) {
            // 에러 알림은 axiosInstance 인터셉터가 자동으로 처리합니다.
            console.error("Chat send error:", error);
            const errorMessage = error.response?.data?.message || "응답 생성 중 오류가 발생했습니다.";
            dispatch(addAiMessage(`오류: ${errorMessage}`));
        }
    };

    const handleContextSubmit = (context) => {
        const firstMessage = context.file 
            ? `파일(${context.file.name})을 업로드했습니다. 이 내용을 바탕으로 대화를 시작합니다.`
            : `다음 내용을 바탕으로 대화를 시작합니다:\n\n${context.text}`;
        dispatch(clearChat());
        dispatch(addAiMessage(firstMessage));
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-inter">
            <div className="container mx-auto p-6 flex flex-col h-screen">
                <div className="flex items-center mb-6 flex-shrink-0">
                    <Link to={urlId ? "/history" : "/dashboard"} className="p-2 mr-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 truncate">
                        {pageTitle}
                    </h1>
                </div>
                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* 새 대화일 때만 컨텍스트 업로드 UI 표시 */}
                    {!urlId && (
                        <>
                            <ResumeUploadSection onAnalyzeProp={handleContextSubmit} isLoading={isAiTyping} />
                            <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
                                <ChatWindow messages={messages} isThinking={isAiTyping} />
                                <ChatInput onSendMessage={handleSendMessage} isLoading={isAiTyping} />
                            </main>
                        </>
                    )}
                    {/* 이전 대화 불러왔을 때는 채팅창만 전체 너비로 표시 */}
                    {urlId && (
                        <main className="w-full flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
                            <ChatWindow messages={messages} isThinking={isAiTyping} />
                            <ChatInput onSendMessage={handleSendMessage} isLoading={isAiTyping} />
                        </main>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChatbotPage;
