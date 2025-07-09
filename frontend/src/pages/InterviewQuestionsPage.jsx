import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
// [수정] 직접 만든 axiosInstance를 임포트합니다.
import axiosInstance from '../utils/axiosInstance'; 

import QuestionGenerationControls from '../components/QuestionGenerationControls';
import GeneratedQuestionsDisplay from '../components/GeneratedQuestionsDisplay';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

import { addUserMessage, addAiMessage, clearChat, startQuestionChat } from '../features/chat/chatSlice';
import { startQuestionGeneration, questionGenerationSuccess, clearGeneratedQuestions } from '../features/interview/interviewSlice';
// [수정] notifyError는 axiosInstance에서 처리하므로 여기서 직접 사용할 필요가 없습니다.
// import { notifyError } from '../components/Notification';

function InterviewQuestionsPage() {
    const dispatch = useDispatch();

    const { generatedQuestions, isLoading: isLoadingQuestions, error: questionGenerationError } = useSelector((state) => state.interview);
    const { messages: chatMessages, isAiTyping } = useSelector((state) => state.chat);

    const [isChatMode, setIsChatMode] = useState(false);
    const [currentQuestionForChat, setCurrentQuestionForChat] = useState(null);

    useEffect(() => {
        return () => {
            dispatch(clearGeneratedQuestions());
            dispatch(clearChat());
        };
    }, [dispatch]);

    /**
     * 질문 생성은 성공했다고 가정하고, 가짜(mock) 데이터를 사용합니다.
     */
    const generateQuestions = (options) => {
        if (isLoadingQuestions) return;

        // [참고] notifyError는 이제 axiosInstance에서 호출되므로 여기서 직접 호출할 필요가 없습니다.
        if (!options.companyName && !options.resumeFile) {
            // notifyError('회사 이름을 입력하거나 이력서 파일을 첨부해주세요.');
            // 간단한 유효성 검사는 alert나 다른 UI로 처리할 수 있습니다.
            alert('회사 이름을 입력하거나 이력서 파일을 첨부해주세요.');
            return;
        }

        dispatch(startQuestionGeneration());
        dispatch(clearChat());
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
        dispatch(startQuestionChat(question));
    };

    /**
     * [수정됨] axiosInstance를 사용하여 API를 호출합니다.
     */
    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || isAiTyping) return;

        dispatch(addUserMessage(messageText));

        try {
            // axiosInstance는 baseURL이 '/api'로 설정되어 있으므로, 나머지 경로만 적어줍니다.
            const response = await axiosInstance.post('/chat/send', {
                message: messageText
            });
            
            const aiFeedback = response.data.message; 
            dispatch(addAiMessage(aiFeedback));

        } catch (err) {
            // 에러 알림은 axiosInstance의 응답 인터셉터가 자동으로 처리합니다.
            // 여기서는 채팅창에 에러 메시지를 표시하는 등 UI 관련 로직만 처리합니다.
            console.error("Chat send error:", err);
            const errorMessage = err.response?.data?.message || "피드백을 가져오는 중 오류가 발생했습니다.";
            dispatch(addAiMessage(`오류: ${errorMessage}`));
        }
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
                                <ChatWindow messages={chatMessages} isThinking={isAiTyping} />
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
