import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import ResumeUploadSection from '../components/ResumeUploadSection';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import { addUserMessage, addAiMessage, setMessages, clearChat, setAiTyping } from '../features/chat/chatSlice';
import axiosInstance from '../utils/axiosInstance';

function ChatbotPage() {
    const { id: urlId } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { messages, isAiTyping } = useSelector((state) => state.chat);
    const [pageTitle, setPageTitle] = useState("AI 커리어 챗봇");

    useEffect(() => {
        return () => {
            dispatch(clearChat());
        };
    }, [dispatch]);
    
    useEffect(() => {
        const fetchConversationById = async (id) => {
            dispatch(setAiTyping(true));
            try {
                const response = await axiosInstance.get(`/chat/${id}`);
                const loadedMessages = response.data;

                if (loadedMessages && Array.isArray(loadedMessages)) {
                    const formattedMessages = loadedMessages.map(msg => ({
                        id: msg.chatId,
                        sender: msg.sender ? 'user' : 'ai',
                        text: msg.message
                    }));
                    dispatch(setMessages(formattedMessages));
                    
                    const firstUserMessage = formattedMessages.find(m => m.sender === 'user');
                    setPageTitle(firstUserMessage ? firstUserMessage.text : "이전 대화");

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
            dispatch(addAiMessage({ text: '안녕하세요! AI 커리어 챗봇입니다. 무엇을 도와드릴까요?' }));
            setPageTitle("AI 커리어 챗봇 (새 대화)");
        }
    }, [urlId, navigate, dispatch]);

    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || isAiTyping) return;

        const currentConversationId = urlId || null;
        dispatch(addUserMessage({ text: messageText, conversationId: currentConversationId }));
        
        try {
            const response = await axiosInstance.post('/chat/send', {
                message: messageText,
                conversationId: currentConversationId
            });
            
            const aiResponse = response.data;
            dispatch(addAiMessage({ text: aiResponse.message, conversationId: aiResponse.conversationId }));

            if (!urlId && aiResponse.conversationId) {
                navigate(`/chatbot/${aiResponse.conversationId}`, { replace: true });
            }

        } catch (error) {
            console.error("Chat send error:", error);
            const errorMessage = error.response?.data?.message || "응답 생성 중 오류가 발생했습니다.";
            dispatch(addAiMessage({ text: `오류: ${errorMessage}` }));
        }
    };

    /**
     * [수정] 컨텍스트(파일/텍스트)를 실제 서버에 제출하여 새 대화를 시작합니다.
     */
    const handleContextSubmit = async (context) => {
        dispatch(setAiTyping(true));
        try {
            const formData = new FormData();
            if (context.file) {
                formData.append('file', context.file);
            } else {
                formData.append('text', context.text);
            }

            // 컨텍스트를 제출하여 새 대화를 생성하는 API 호출 (가정)
            const response = await axiosInstance.post('/chat/new-with-context', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            
            const newConversationId = response.data.conversationId; // 응답으로 새 대화 ID를 받는다고 가정
            if (newConversationId) {
                // 새 대화 페이지로 이동하면, useEffect가 대화 내용을 불러옵니다.
                navigate(`/chatbot/${newConversationId}`);
            }

        } catch (error) {
            console.error("Error creating new conversation with context:", error);
            // 에러 알림은 axiosInstance 인터셉터가 처리합니다.
        } finally {
            dispatch(setAiTyping(false));
        }
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
                    {!urlId && (
                        <>
                            <ResumeUploadSection onAnalyzeProp={handleContextSubmit} isLoading={isAiTyping} />
                            <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
                                <ChatWindow messages={messages} isThinking={isAiTyping} />
                                <ChatInput onSendMessage={handleSendMessage} isLoading={isAiTyping} />
                            </main>
                        </>
                    )}
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
