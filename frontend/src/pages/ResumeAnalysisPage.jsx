import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
// axiosInstance는 더 이상 사용하지 않으므로 제거합니다.
// import axiosInstance from '../utils/axiosInstance'; 

// 컴포넌트 임포트
import ResumeUploadSection from '../components/ResumeUploadSection';
import AnalysisResultDisplay from '../components/AnalysisResultDisplay';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

// Redux 액션 임포트 (analysisSlice 관련만 유지)
import { startAnalysis, analysisSuccess, analysisFailure, clearAnalysis } from '../features/analysis/analysisSlice';
// 채팅 관련 Redux 액션은 로컬 상태로 전환했으므로 제거합니다.
// import { addUserMessage, addAiMessage, clearChat } from '../features/chat/chatSlice'; 

/**
 * AI 이력서 분석 페이지 컴포넌트입니다.
 */
function ResumeAnalysisPage() {
    // analysisSlice 관련 Redux 상태 및 디스패치 유지
    const dispatch = useDispatch();
    const {
        results: analysisResults,
        isLoading: isAnalysisLoading,
        error: analysisError
    } = useSelector((state) => state.analysis);

    // 채팅 메시지를 로컬 useState로 관리
    const [chatMessages, setChatMessages] = useState([]);
    const [isAiTyping, setIsAiTyping] = useState(false); // AI 타이핑 상태도 로컬로 관리

    const [isAnalysisChatMode, setIsAnalysisChatMode] = useState(false);
    const messagesEndRef = useRef(null); // ResumeAnalysisPage에서 정의한 ref

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

    // 초기 메시지 설정 함수
    const initializeChat = () => {
        const initialMessage = "이력서 분석이 완료되었습니다! 이 내용을 바탕으로 궁금한 점을 질문해보세요.";
        addAiMessage(initialMessage);
    };

    // 컴포넌트 마운트 시 초기화 및 메시지 상태 변경 감시
    useEffect(() => {
        // 컴포넌트 언마운트 시 분석 결과 및 채팅 초기화
        return () => {
            dispatch(clearAnalysis());
            setChatMessages([]); // 로컬 채팅 상태 초기화
        };
    }, [dispatch]);

    // chatMessages 상태 변경 시 스크롤 (기존 로직 유지)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);


    /**
     * [유지] 분석 API가 준비될 때까지 성공을 시뮬레이션합니다.
     */
    const analyzeResume = async () => {
        if (isAnalysisLoading) return;

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
        
        // 분석 완료 후 초기 AI 메시지 추가
        initializeChat(); 
    };

    // 모든 상태 초기화 (로컬 채팅 상태 포함)
    const handleClearAll = () => {
        dispatch(clearAnalysis());
        setChatMessages([]); // 로컬 채팅 상태 초기화
        setIsAnalysisChatMode(false);
    };

    const handleReEnterAnalysisChat = () => setIsAnalysisChatMode(true);
    const handleExitAnalysisChatMode = () => setIsAnalysisChatMode(false);

    /**
     * [수정됨] fetch API를 사용하여 채팅 API를 호출합니다. (JWT 토큰 포함)
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

    // 질문 버튼 클릭 처리 함수
    const handleExampleQuestionClick = (questionText) => {
        handleSendMessage(questionText);
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
                                {/* messagesEndRef를 ChatWindow에 전달 */}
                                <ChatWindow messages={chatMessages} isThinking={isAiTyping} messagesEndRef={messagesEndRef} />
                                <ChatInput
                                    onSendMessage={handleSendMessage}
                                    isLoading={isAiTyping}
                                    handleClearChat={handleClearAll}
                                    handleExampleQuestionClick={handleExampleQuestionClick}
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
