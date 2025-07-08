import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// 컴포넌트 임포트
import ResumeUploadSection from '../components/ResumeUploadSection';
import AnalysisResultDisplay from '../components/AnalysisResultDisplay';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

// Redux 액션 임포트
import { startAnalysis, analysisSuccess, analysisFailure, clearAnalysis } from '../features/analysis/analysisSlice';
import { addUserMessage, addAiMessage, clearChat } from '../features/chat/chatSlice';

// 알림 컴포넌트 임포트
import { notifyError } from '../components/Notification';


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
        error: chatError
    } = useSelector((state) => state.chat);

    const [isAnalysisChatMode, setIsAnalysisChatMode] = useState(false);
    const messagesEndRef = useRef(null);

    // 페이지를 벗어날 때 상태 초기화 (버그 수정)
    useEffect(() => {
        return () => {
            dispatch(clearAnalysis());
            dispatch(clearChat());
        };
    }, [dispatch]);

    // 자동 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    // 이력서 분석 요청 핸들러
    const analyzeResume = async (options) => {
        if (isAnalysisLoading) return;
        dispatch(startAnalysis());
        setIsAnalysisChatMode(false);

        await new Promise(resolve => setTimeout(resolve, 2000)); // API 호출 시뮬레이션

        try {
            if (Math.random() > 0.1) { // 90% 성공 확률
                const mockResults = { 
                    summary: "React와 Spring Boot 기반 웹 개발에 강점을 가진 5년차 소프트웨어 개발자로, 문제 해결 및 협업 능력이 뛰어납니다.",
                    skills: ["React.js", "Spring Boot", "JavaScript", "Java", "RESTful API", "Git", "SQL"],
                    recommendations: "백엔드 개발자, 풀스택 개발자 직무에 적합합니다.",
                    recommendedSkills: ["Kubernetes", "AWS", "Microservices"]
                };
                dispatch(analysisSuccess(mockResults));
                setIsAnalysisChatMode(true);
                dispatch(addAiMessage(`이력서 분석이 완료되었습니다! 분석 결과에 대해 궁금한 점을 질문해보세요.`));
            } else {
                throw new Error("데모 분석 중 오류가 발생했습니다.");
            }
        } catch (err) {
            const message = err.message || "알 수 없는 오류가 발생했습니다.";
            dispatch(analysisFailure(message));
            notifyError(message);
        }
    };
    
    // 전체 초기화 핸들러
    const handleClearAll = () => {
        dispatch(clearAnalysis());
        dispatch(clearChat());
        setIsAnalysisChatMode(false);
    };

    // 채팅 모드 진입/종료 핸들러
    const handleReEnterAnalysisChat = () => setIsAnalysisChatMode(true);
    const handleExitAnalysisChatMode = () => setIsAnalysisChatMode(false);
    
    // 채팅 메시지 전송 핸들러
    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || isAiTyping) return;
        dispatch(addUserMessage(messageText));
        await new Promise(resolve => setTimeout(resolve, 1500));
        const aiFeedback = `"${messageText.substring(0, 15)}..."에 대한 AI의 데모 답변입니다.`;
        dispatch(addAiMessage(aiFeedback));
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
                    <Link to="/dashboard" className="p-2 mr-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                        AI 이력서 분석
                    </h1>
                </div>

                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* 왼쪽 컬럼: 설정 패널 */}
                    <ResumeUploadSection onAnalyzeProp={analyzeResume} isLoading={isAnalysisLoading} />

                    {/* 오른쪽 컬럼: 결과 또는 채팅창 */}
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
                                    <div className="mt-4 flex justify-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                            <div className="flex flex-col h-full">
                                <h2 className="text-2xl font-bold p-6 pb-4 text-center border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-50">
                                    이력서 분석 대화
                                    <button onClick={handleExitAnalysisChatMode} className="float-right text-sm font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                                        [결과 보기]
                                    </button>
                                </h2>
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

export default ResumeAnalysisPage;