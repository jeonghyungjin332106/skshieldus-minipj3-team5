import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import QuestionGenerationControls from '../components/QuestionGenerationControls';
import GeneratedQuestionsDisplay from '../components/GeneratedQuestionsDisplay';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

import { addUserMessage, addAiMessage, clearChat, startQuestionChat } from '../features/chat/chatSlice';
import { startQuestionGeneration, questionGenerationSuccess, questionGenerationFailure, clearGeneratedQuestions } from '../features/interview/interviewSlice';
import { notifyError } from '../components/Notification';

function InterviewQuestionsPage() {
    const dispatch = useDispatch();

    const { generatedQuestions, isLoading: isLoadingQuestions, error: questionGenerationError } = useSelector((state) => state.interview);
    const { messages: chatMessages, isAiTyping, error: chatError } = useSelector((state) => state.chat);
    
    const [isChatMode, setIsChatMode] = useState(false);
    const [currentQuestionForChat, setCurrentQuestionForChat] = useState(null);

    // --- 💡 1. 페이지를 벗어날 때 상태 초기화 로직 추가 ---
    useEffect(() => {
        return () => {
            dispatch(clearGeneratedQuestions());
            dispatch(clearChat());
        };
    }, [dispatch]);

    // (핸들러 함수들은 기존 코드와 동일)
    const generateQuestions = (options) => {
        if (isLoadingQuestions) return;
        if (!options.companyName && !options.resumeFile) {
            notifyError('회사 이름을 입력하거나 이력서 파일을 첨부해주세요.');
            return;
        }
        dispatch(startQuestionGeneration());
        dispatch(clearChat());
        setIsChatMode(false);

        // API 호출 시뮬레이션
        setTimeout(() => {
            // ... (기존과 동일한 질문 생성 로직) ...
            const mockQuestions = ["지원한 동기가 무엇인가요?", `${options.companyName}에 대해 아는 것을 말해보세요.`];
            dispatch(questionGenerationSuccess(mockQuestions));
        }, 2000);
    };
    
    const handleOpenFeedbackChat = (question) => {
        setIsChatMode(true);
        setCurrentQuestionForChat(question);
        dispatch(startQuestionChat(question));
    };

    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || isAiTyping) return;
        dispatch(addUserMessage(messageText));
        await new Promise(resolve => setTimeout(resolve, 1500));
        dispatch(addAiMessage(`"${messageText.substring(0,15)}..."에 대한 AI 피드백입니다.`));
    };
    
    const handleExitChatMode = () => {
        setIsChatMode(false);
        setCurrentQuestionForChat(null);
        dispatch(clearChat());
    };

    const handleClearAll = () => {
        dispatch(clearGeneratedQuestions());
        dispatch(clearChat());
        setIsChatMode(false);
        setCurrentQuestionForChat(null);
    };

    const exampleQuestions = [ "답변 예시를 보여줘.", "어떤 키워드를 포함해야 할까?", "질문을 다시 요약해줘." ];

    return (
        // --- 💡 2. 전체 레이아웃 및 디자인 통일 ---
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-inter">
            <div className="container mx-auto p-6 flex flex-col h-screen">
                <div className="flex items-center mb-6 flex-shrink-0">
                    <Link to="/dashboard" className="p-2 mr-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                        AI 면접 예상 질문
                    </h1>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* 왼쪽 컬럼: 질문 생성 설정 */}
                    <QuestionGenerationControls onGenerate={generateQuestions} isLoading={isLoadingQuestions} />

                    {/* 오른쪽 컬럼: 생성된 질문 목록 또는 피드백 채팅 */}
                    <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
                        {!isChatMode ? (
                            // 질문 목록 표시
                            <div className="p-6 flex flex-col h-full">
                                <h2 className="text-2xl font-bold mb-4 text-center border-b border-gray-200 dark:border-gray-700 pb-4 text-gray-800 dark:text-gray-50">
                                    생성된 질문 목록
                                </h2>
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
                                        onFeedbackRequest={handleOpenFeedbackChat}
                                    />
                                </div>
                                {(generatedQuestions?.length > 0 || questionGenerationError) && (
                                    <div className="mt-4 pt-4 text-center border-t border-gray-200 dark:border-gray-700">
                                        <button onClick={handleClearAll} className="px-6 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors">
                                            모두 초기화
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // 피드백 채팅 표시
                            <div className="flex flex-col h-full">
                                <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-50">
                                        면접 피드백 채팅
                                    </h2>
                                    <p className="text-center text-gray-500 dark:text-gray-400 mt-1 truncate">"{currentQuestionForChat}"</p>
                                    <button onClick={handleExitChatMode} className="absolute top-6 right-6 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                                        [목록으로]
                                    </button>
                                </div>
                                <ChatWindow messages={chatMessages} isThinking={isAiTyping} />
                                <ChatInput
                                    onSendMessage={handleSendMessage}
                                    isLoading={isAiTyping}
                                    handleClearChat={handleClearAll}
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