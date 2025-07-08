// src/pages/ChatbotPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ResumeUploadSection from '../components/ResumeUploadSection';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
// --- 💡 1. 새로운 목업 데이터를 import 합니다. ---
import { MOCK_CONVERSATIONS } from '../mocks/data.js';

function ChatbotPage() {
    const { id: urlId } = useParams();
    const navigate = useNavigate();

    const [conversationId, setConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pageTitle, setPageTitle] = useState("AI 커리어 챗봇");

    useEffect(() => {
        // --- 💡 2. urlId를 사용해 올바른 대화 데이터를 찾는 로직을 수정합니다. ---
        if (urlId) {
            setIsLoading(true);
            
            // 전체 목록에서 urlId와 일치하는 대화 정보를 찾습니다.
            const loadedData = MOCK_CONVERSATIONS.find(conv => conv._id === urlId);

            if (loadedData) {
                // 찾은 데이터의 chatHistory를 사용합니다.
                const formattedMessages = loadedData.chatHistory.map(msg => ({
                    sender: msg.role === 'assistant' ? 'ai' : 'user',
                    text: msg.content
                }));
                
                setMessages(formattedMessages);
                setPageTitle(loadedData.title);
                setConversationId(loadedData._id);
            } else {
                console.error("Error: Conversation ID not found", urlId);
                navigate('/history'); // 일치하는 ID가 없으면 히스토리 페이지로 이동
            }
            setIsLoading(false);
        } else {
            // 새 대화 상태 초기화
            setMessages([]);
            setPageTitle("AI 커리어 챗봇 (새 대화)");
            setConversationId(null);
        }
    }, [urlId, navigate]);

    // (handleSendMessage, handleContextSubmit 등 나머지 핸들러는 이전과 동일)
    const handleSendMessage = async (messageText) => { /* ... */ };
    const handleContextSubmit = (context) => { /* ... */ };

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
                    {/* ID가 없을 때 (새 대화) => 2단 레이아웃 */}
                    {!urlId && (
                        <>
                            <ResumeUploadSection onAnalyzeProp={handleContextSubmit} isLoading={isLoading} />
                            <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
                                <ChatWindow messages={messages} isThinking={isLoading} />
                                <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                            </main>
                        </>
                    )}

                    {/* ID가 있을 때 (대화 이어하기) => 1단 채팅창 레이아웃 */}
                    {urlId && (
                        <main className="w-full flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
                            <ChatWindow messages={messages} isThinking={isLoading} />
                            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
                        </main>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChatbotPage;