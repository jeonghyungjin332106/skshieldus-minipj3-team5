// src/pages/ResumeAnalysisPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios'; 

// 필요한 컴포넌트들을 임포트합니다.
// ContentUpload 대신 ResumeUploadSection을 임포트합니다.
import ResumeUploadSection from '../components/ResumeUploadSection'; // <-- ContentUpload 대신 사용
import AnalysisResultDisplay from '../components/AnalysisResultDisplay';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

// Redux 슬라이스 액션들을 임포트합니다.
import { startAnalysis, analysisSuccess, analysisFailure, clearAnalysis } from '../features/analysis/analysisSlice';
import { addUserMessage, addAiMessage, setAiTyping, setChatError, clearChat } from '../features/chat/chatSlice';

// 사용자 알림 컴포넌트를 임포트합니다.
import { notifyError } from '../components/Notification';


// 백엔드 API 기본 URL
const BACKEND_API_BASE_URL = '/api'; 

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

    const { token } = useSelector((state) => state.auth);

    const [isAnalysisChatMode, setIsAnalysisChatMode] = useState(false);
    const [currentAnalyzedResume, setCurrentAnalyzedResume] = useState(null);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    /**
     * 이력서 분석 요청을 처리하는 비동기 함수입니다.
     * ResumeUploadSection 컴포넌트의 onAnalyzeProp으로 전달됩니다.
     * @param {object} options - 분석에 필요한 옵션 ({ file, text, chunkSize, chunkOverlap, temperature })
     */
    const analyzeResume = async ({ file, text, chunkSize, chunkOverlap, temperature }) => {
        if (isAnalysisLoading) return;

        dispatch(startAnalysis());
        dispatch(clearChat());
        setIsAnalysisChatMode(false);

        console.log("백엔드 API 호출 시뮬레이션 시작:", file ? file.name : (text ? "텍스트 입력" : "없음"));
        console.log("고급 설정:", { chunkSize, chunkOverlap, temperature });

        // 실제 백엔드 API 호출로 변경할 부분
        // 현재는 데모 시뮬레이션 유지
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            if (Math.random() > 0.1) {
                const mockResults = { 
                    summary: "이력서에 따르면, 소프트웨어 개발 분야에서 5년 이상의 경력을 보유하고 있으며, 특히 React와 Spring Boot 기반의 웹 애플리케이션 개발에 강점을 보입니다. 문제 해결 능력과 팀 협업 능력이 뛰어납니다.",
                    skills: ["React.js", "Spring Boot", "JavaScript", "Java", "RESTful API", "Git", "SQL"],
                    recommendations: "백엔드 개발자, 풀스택 개발자, 또는 자바 기반의 엔터프라이즈 솔루션 개발 직무에 적합합니다.",
                    recommendedSkills: ["Kubernetes", "AWS Cloud", "Microservices Architecture"]
                };
                dispatch(analysisSuccess(mockResults));

                setCurrentAnalyzedResume(file ? file.name : (text ? "직접 입력 텍스트" : null));
                setIsAnalysisChatMode(true);

                const aiIntroMessage = `이력서 분석이 완료되었습니다!\n\n` +
                                       `요약: ${mockResults.summary}\n\n` +
                                       `더 궁금한 점이 있으시면 자유롭게 질문해주세요.`;
                dispatch(addAiMessage(aiIntroMessage));

            } else {
                const errorMessage = "이력서 분석 중 예상치 못한 오류가 발생했습니다. (데모 오류)";
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error("이력서 분석 시뮬레이션 오류:", err);
            dispatch(analysisFailure(err.message || "알 수 없는 오류가 발생했습니다. (데모 오류)"));
            notifyError(err.message || "이력서 분석 중 알 수 없는 오류 발생!");
            setIsAnalysisChatMode(false);
            dispatch(setChatError(err.message || "채팅 오류 발생"));
        }
    };

    const handleClearAnalysis = () => {
        dispatch(clearAnalysis());
        dispatch(clearChat());
        setIsAnalysisChatMode(false);
        setCurrentAnalyzedResume(null);
    };

    const handleReEnterAnalysisChat = () => { /* ... 기존과 동일 ... */ };
    const handleSendMessage = async (messageText) => { /* ... 기존과 동일 ... */ };
    const handleExampleQuestionClick = (question) => { /* ... 기존과 동일 ... */ };
    const handleExitAnalysisChatMode = () => { /* ... 기존과 동일 ... */ };

    const exampleQuestions = [
        "이력서 요약 내용을 다시 알려줘.",
        "내 강점들을 활용할 수 있는 직무가 있을까?",
        "이력서를 바탕으로 예상 면접 질문을 해줘."
    ];


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-inter p-6
                        dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900 dark:text-gray-50">
                    AI 이력서 분석 & 커리어 챗봇
                </h1>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* 왼쪽 컬럼: ContentUpload 대신 ResumeUploadSection 컴포넌트 사용 */}
                    {/* ResumeUploadSection은 이제 파일/텍스트 입력 및 고급 설정 기능 모두 가집니다. */}
                    <div className="md:col-span-1">
                        <ResumeUploadSection onAnalyzeProp={analyzeResume} isLoading={isAnalysisLoading} />
                    </div>

                    {/* 오른쪽 컬럼: 분석 결과 표시 또는 채팅 인터페이스 */}
                    <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 p-6
                                   dark:bg-gray-700 dark:border-gray-600">
                        {!isAnalysisChatMode ? (
                            <>
                                <h2 className="text-2xl font-bold mb-4 text-center border-b pb-2 text-gray-800 dark:text-gray-50 dark:border-gray-600">
                                    분석 결과
                                </h2>
                                
                                {analysisError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                        <strong className="font-bold">분석 오류:</strong>
                                        <span className="block sm:inline ml-2">{analysisError}</span>
                                    </div>
                                )}
                                <AnalysisResultDisplay
                                    analysisResults={analysisResults}
                                    isLoading={isAnalysisLoading}
                                />
                                {(analysisResults || analysisError) && (
                                    <div className="mt-4 flex justify-center space-x-4">
                                        {analysisResults && (
                                            <button
                                                onClick={handleReEnterAnalysisChat}
                                                className="bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300
                                                           dark:bg-blue-700 dark:hover:bg-blue-800"
                                            >
                                                분석 결과로 대화하기
                                            </button>
                                        )}
                                        <button
                                            onClick={handleClearAnalysis}
                                            className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-500 transition-colors duration-300
                                                       dark:bg-gray-600 dark:hover:bg-gray-700"
                                        >
                                            분석 초기화
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col h-full">
                                <h2 className="text-2xl font-bold mb-4 text-center border-b pb-2 text-gray-800 dark:text-gray-50 dark:border-gray-600">
                                    이력서 분석 대화
                                    <button onClick={handleExitAnalysisChatMode} className="float-right text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                        [나가기]
                                    </button>
                                </h2>
                                {chatError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                                        <strong className="font-bold">채팅 오류:</strong>
                                        <span className="block sm:inline ml-2">{chatError}</span>
                                    </div>
                                )}
                                <ChatWindow messages={chatMessages} isThinking={isAiTyping} messagesEndRef={messagesEndRef} />
                                
                                <ChatInput
                                    onSendMessage={handleSendMessage}
                                    isLoading={isAiTyping}
                                    handleClearChat={handleClearAnalysis}
                                    handleExampleQuestionClick={handleExampleQuestionClick}
                                    exampleQuestions={exampleQuestions}
                                />
                            </div>
                        )}
                    </main>
                </div>

                <div className="mt-12 text-center text-gray-600 dark:text-gray-400">
                    <p>이 페이지에서 이력서 파일을 업로드하거나 직접 입력하고 AI 분석 결과를 받아볼 수 있으며, 분석 결과에 대해 AI와 대화할 수 있습니다.</p>
                </div>
            </div>
        </div>
    );
}

export default ResumeAnalysisPage;