import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
// [수정] 직접 만든 axiosInstance를 임포트합니다.
import axiosInstance from '../utils/axiosInstance';

// 컴포넌트 임포트
import ResumeUploadSection from '../components/ResumeUploadSection';
import AnalysisResultDisplay from '../components/AnalysisResultDisplay';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

// Redux 액션 임포트
import { startAnalysis, analysisSuccess, analysisFailure, clearAnalysis } from '../features/analysis/analysisSlice';
import { addUserMessage, addAiMessage, clearChat } from '../features/chat/chatSlice';

/**
 * AI 이력서 분석 페이지 컴포넌트입니다.
 */
function ResumeAnalysisPage() {
    const dispatch = useDispatch();

    const {
        results: analysisResults,
        isLoading: isAnalysisLoading,
        error: analysisError
    } = useSelector((state) => state.analysis);

    const {
        messages: chatMessages,
        isAiTyping,
    } = useSelector((state) => state.chat);

    const [isAnalysisChatMode, setIsAnalysisChatMode] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        return () => {
            dispatch(clearAnalysis());
            dispatch(clearChat());
        };
    }, [dispatch]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    /**
     * [유지] 분석 API가 준비될 때까지 성공을 시뮬레이션합니다.
     */
    const analyzeResume = async () => {
        if (isAnalysisLoading) return;

        console.log("임시 분석을 시작합니다. (API 호출 없음)");

        dispatch(startAnalysis());
        setIsAnalysisChatMode(false);

        await new Promise(resolve => setTimeout(resolve, 2000));

        const mockResults = {
            summary: "React와 Spring Boot 기반 웹 개발에 강점을 가진 5년차 소프트웨어 개발자로, 문제 해결 및 협업 능력이 뛰어납니다.",
            skills: ["React.js", "Spring Boot", "JavaScript", "Java", "RESTful API", "Git", "SQL"],
            recommendations: "백엔드 개발자, 풀스택 개발자 직무에 적합합니다.",
            recommendedSkills: ["Kubernetes", "AWS", "Microservices"]
        };
        
        dispatch(analysisSuccess(mockResults));
        setIsAnalysisChatMode(true);
        
        dispatch(addAiMessage(`이력서 분석이 완료되었습니다! 이 내용을 바탕으로 궁금한 점을 질문해보세요.`));
    };

    const handleClearAll = () => {
        dispatch(clearAnalysis());
        dispatch(clearChat());
        setIsAnalysisChatMode(false);
    };

    const handleReEnterAnalysisChat = () => setIsAnalysisChatMode(true);
    const handleExitAnalysisChatMode = () => setIsAnalysisChatMode(false);

    /**
     * [수정됨] axiosInstance를 사용하여 채팅 API를 호출합니다.
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

        } catch (err) {
            // 에러 알림은 axiosInstance 인터셉터가 자동으로 처리합니다.
            console.error("Chat send error:", err);
            const errorMessage = err.response?.data?.message || "답변을 가져오는 중 오류가 발생했습니다.";
            dispatch(addAiMessage(`오류: ${errorMessage}`));
        }
    };

    const exampleQuestions = [
        "이력서 요약 내용을 다시 알려줘.",
        "내 강점들을 활용할 수 있는 직무가 있을까?",
        "이력서를 바탕으로 예상 면접 질문을 해줘."
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-inter">
            <div className="container mx-auto p-6 flex flex-col h-screen">
                <div className="flex items-center mb-6 flex-shrink-0">
                    <Link
                        to="/dashboard"
                        className="p-2 mr-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="대시보드로 돌아가기"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                        AI 이력서 분석
                    </h1>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    <ResumeUploadSection
                        onAnalyzeProp={analyzeResume}
                        isLoading={isAnalysisLoading}
                    />

                    <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
                        {!isAnalysisChatMode ? (
                            <div className="p-6 flex flex-col h-full">
                                <h2 className="text-2xl font-bold mb-4 text-center border-b border-gray-200 dark:border-gray-700 pb-4 text-gray-800 dark:text-gray-50">
                                    분석 결과
                                </h2>
                                {analysisError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700" role="alert">
                                        <strong className="font-bold">분석 오류:</strong>
                                        <span className="block sm:inline ml-2">{analysisError}</span>
                                    </div>
                                )}
                                <div className="flex-grow overflow-y-auto">
                                    <AnalysisResultDisplay
                                        analysisResults={analysisResults}
                                        isLoading={isAnalysisLoading}
                                    />
                                </div>
                                {(analysisResults || analysisError) && (
                                    <div className="mt-4 flex justify-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                                        {analysisResults && (
                                            <button
                                                onClick={handleReEnterAnalysisChat}
                                                className="px-6 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                            >
                                                분석 결과로 대화하기
                                            </button>
                                        )}
                                        <button
                                            onClick={handleClearAll}
                                            className="px-6 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                                        >
                                            초기화
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col h-full relative">
                                <div className="p-6 pb-4 text-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-50">
                                        이력서 분석 대화
                                    </h2>
                                    <button
                                        onClick={handleExitAnalysisChatMode}
                                        className="absolute top-6 right-6 text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                                        aria-label="분석 결과 보기로 돌아가기"
                                    >
                                        [결과 보기]
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

export default ResumeAnalysisPage;
