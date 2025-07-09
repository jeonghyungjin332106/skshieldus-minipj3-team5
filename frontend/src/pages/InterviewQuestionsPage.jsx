import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
// axiosInstance는 더 이상 사용하지 않으므로 제거합니다.
// import axiosInstance from '../utils/axiosInstance'; 

import QuestionGenerationControls from '../components/QuestionGenerationControls';
import GeneratedQuestionsDisplay from '../components/GeneratedQuestionsDisplay';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import FeedbackButton from '../components/FeedbackButton'; // FeedbackButton 임포트 추가

// Redux 액션 임포트 (interviewSlice 관련만 유지)
// 채팅 관련 Redux 액션은 로컬 상태로 전환했으므로 제거합니다.
// import { addUserMessage, addAiMessage, clearChat, startQuestionChat } from '../features/chat/chatSlice'; 
import { startQuestionGeneration, questionGenerationSuccess, clearGeneratedQuestions } from '../features/interview/interviewSlice';

function InterviewQuestionsPage() {
    const dispatch = useDispatch();

    const { generatedQuestions, isLoading: isLoadingQuestions, error: questionGenerationError } = useSelector((state) => state.interview);
    
    // 채팅 메시지를 로컬 useState로 관리
    const [chatMessages, setChatMessages] = useState([]);
    const [isAiTyping, setIsAiTyping] = useState(false); // AI 타이핑 상태도 로컬로 관리

    const [isChatMode, setIsChatMode] = useState(false);
    const [currentQuestionForChat, setCurrentQuestionForChat] = useState(null);
    const messagesEndRef = useRef(null); // InterviewQuestionsPage에서 정의한 ref

    // 메시지 고유 ID 생성 헬퍼 함수
    const generateMessageId = () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    };

    // 사용자 메시지 추가 함수 (로컬 상태 업데이트)
    const addUserMessage = (messageText) => {
        const newMessage = {
            id: generateMessageId(),
            sender: 'user',
            text: messageText || '', // undefined 방지
            conversationId: null, // 필요시 실제 conversationId 할당
            timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, newMessage]);
    };

    // AI 메시지 추가 함수 (로컬 상태 업데이트)
    const addAiMessage = (messageText) => {
        const newMessage = {
            id: generateMessageId(),
            sender: 'ai',
            text: messageText || '', // undefined 방지
            conversationId: null, // 필요시 실제 conversationId 할당
            timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, newMessage]);
    };

    // 컴포넌트 언마운트 시 초기화 (로컬 채팅 상태 포함)
    useEffect(() => {
        return () => {
            dispatch(clearGeneratedQuestions());
            setChatMessages([]); // 로컬 채팅 상태 초기화
        };
    }, [dispatch]);

    // chatMessages 상태 변경 시 스크롤 (기존 로직 유지)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    /**
     * 질문 생성은 성공했다고 가정하고, 가짜(mock) 데이터를 사용합니다.
     */
    const generateQuestions = (options) => {
        if (isLoadingQuestions) return;

        if (!options.companyName && !options.resumeFile) {
            alert('회사 이름을 입력하거나 이력서 파일을 첨부해주세요.');
            return;
        }

        dispatch(startQuestionGeneration());
        setChatMessages([]); // 새 질문 생성 시 로컬 채팅 초기화
        setIsChatMode(false);

        setTimeout(() => {
            const mockQuestions = [
                "지원한 동기가 무엇인가요?",
                `${options.companyName || '지원한 회사'}에 대해 아는 것을 말해보세요.`,
                "가장 힘들었던 프로젝트 경험과 극복 과정은?",
                "협업 시 갈등 해결 경험이 있다면 설명해주세요.",
                "우리 회사에 기여할 수 있는 부분은 무엇이라고 생각하나요?"
            ];
            dispatch(questionGenerationSuccess(mockQuestions));
        }, 2000);
    };
    
    const handleOpenFeedbackChat = (question) => {
        setIsChatMode(true);
        setCurrentQuestionForChat(question);
        // 채팅 시작 시 초기 질문 설정 (로컬 addAiMessage 사용)
        setChatMessages([]); // 기존 채팅 지우고 시작
        addAiMessage(`면접 질문: "${question}"에 대한 답변을 입력해주세요.`); 
    };

    /**
     * [수정됨] fetch API를 사용하여 API를 호출합니다. (JWT 토큰 포함)
     */
    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || isAiTyping) {
            return;
        }

        const trimmedMessage = messageText.trim();
        
        setIsAiTyping(true); // AI 타이핑 시작
        addUserMessage(trimmedMessage); // 사용자 메시지 추가

        try {
            // JWT 토큰을 localStorage에서 가져옵니다.
            const token = localStorage.getItem('jwtToken'); 
            if (!token) {
                addAiMessage("오류: 인증 토큰이 없어 요청을 보낼 수 없습니다. 로그인해주세요.");
                setIsAiTyping(false);
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Authorization 헤더 추가
            };

            // 백엔드 실제 엔드포인트 경로로 변경: /api/chat/send
            const response = await fetch('/api/chat/send', { 
                method: 'POST',
                headers: headers, // 수정된 헤더 사용
                body: JSON.stringify({
                    userId: "anonymous_user", // 백엔드에서 SecurityContextHolder로 userId를 가져오므로, 이 값은 더미일 수 있습니다.
                    message: trimmedMessage,
                    conversationId: null // 필요시 실제 conversationId
                }),
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // API 응답에서 실제 AI 답변 추출 (백엔드 응답 필드명에 따라 조정)
                const aiResponseText = result.aiResponse || 
                                       result.message || 
                                       result.text || 
                                       result.content || 
                                       `AI의 데모 답변입니다: ${trimmedMessage}`; // 폴백 메시지
                
                addAiMessage(aiResponseText);
            } else {
                const errorData = await response.json().catch(() => ({}));
                addAiMessage(`오류: ${errorData.detail || errorData.message || '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.'}`);
            }
        } catch (error) {
            addAiMessage('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsAiTyping(false); // AI 타이핑 종료
        }
    };

    const handleExitChatMode = () => {
        setIsChatMode(false);
        setCurrentQuestionForChat(null);
        setChatMessages([]); // 로컬 채팅 상태 초기화
    };

    const handleClearAll = () => {
        dispatch(clearGeneratedQuestions());
        setChatMessages([]); // 로컬 채팅 상태 초기화
        setIsChatMode(false);
        setCurrentQuestionForChat(null);
    };

    const exampleQuestions = ["답변 예시를 보여줘.", "어떤 키워드를 포함해야 할까?", "질문을 다시 요약해줘."];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-inter">
            <div className="container mx-auto p-6 flex flex-col h-screen">
                <div className="flex items-center mb-6 flex-shrink-0">
                    <Link to="/dashboard" className="p-2 mr-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">AI 면접 예상 질문</h1>
                </div>
                <div className="flex flex-1 gap-6 overflow-hidden">
                    <QuestionGenerationControls onGenerate={generateQuestions} isLoading={isLoadingQuestions} />
                    <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
                        {!isChatMode ? (
                            <div className="p-6 flex flex-col h-full">
                                <h2 className="text-2xl font-bold mb-4 text-center border-b border-gray-200 dark:border-gray-700 pb-4 text-gray-800 dark:text-gray-50">생성된 질문 목록</h2>
                                {questionGenerationError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-2 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700" role="alert">
                                        <strong className="font-bold">오류:</strong>
                                        <span className="block sm:inline ml-2">{questionGenerationError}</span>
                                    </div>
                                )}
                                <div className="flex-grow overflow-y-auto mt-4">
                                    <GeneratedQuestionsDisplay
                                        questions={generatedQuestions}
                                        isLoading={isLoadingQuestions}
                                        error={questionGenerationError}
                                        onFeedbackRequest={handleOpenFeedbackChat}
                                    />
                                </div>
                                {(generatedQuestions?.length > 0 || questionGenerationError) && (
                                    <div className="mt-4 pt-4 text-center border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                                        <button onClick={handleClearAll} className="px-6 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">
                                            모두 초기화
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col h-full relative">
                                <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-50">면접 피드백 채팅</h2>
                                    <p className="text-center text-gray-500 dark:text-gray-400 mt-1 truncate">"{currentQuestionForChat}"</p>
                                    <button onClick={handleExitChatMode} className="absolute top-6 right-6 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                                        [목록으로]
                                    </button>
                                </div>
                                {/* messagesEndRef를 ChatWindow에 전달 */}
                                <ChatWindow messages={chatMessages} isThinking={isAiTyping} messagesEndRef={messagesEndRef} />
                                <ChatInput
                                    onSendMessage={handleSendMessage}
                                    isLoading={isAiTyping}
                                    handleClearChat={handleClearAll}
                                    handleExampleQuestionClick={handleSendMessage}
                                    exampleQuestions={exampleQuestions}
                                />
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default InterviewQuestionsPage;
