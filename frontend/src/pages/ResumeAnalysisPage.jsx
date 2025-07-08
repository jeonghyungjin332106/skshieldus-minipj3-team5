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

/**
 * AI 이력서 분석 페이지 컴포넌트입니다.
 * 사용자가 이력서를 업로드하면 AI가 이를 분석하고, 분석 결과에 대한 대화형 피드백을 제공합니다.
 */
function ResumeAnalysisPage() {
    const dispatch = useDispatch();

    // Redux 스토어에서 이력서 분석 관련 상태를 가져옵니다.
    const {
        results: analysisResults,
        isLoading: isAnalysisLoading,
        error: analysisError
    } = useSelector((state) => state.analysis);

    // Redux 스토어에서 채팅 관련 상태를 가져옵니다.
    const {
        messages: chatMessages,
        isAiTyping,
        error: chatError // 현재 사용되지 않지만, 오류 처리 확장을 위해 유지
    } = useSelector((state) => state.chat);

    // 컴포넌트 내부 UI 상태 관리
    const [isAnalysisChatMode, setIsAnalysisChatMode] = useState(false); // 분석 결과 모드(false) 또는 채팅 모드(true)
    const messagesEndRef = useRef(null); // 채팅 메시지 자동 스크롤을 위한 ref

    /**
     * 컴포넌트 언마운트 시 Redux 상태를 초기화합니다.
     * 이력서 분석 결과와 채팅 기록을 모두 지웁니다.
     */
    useEffect(() => {
        return () => {
            dispatch(clearAnalysis()); // 이력서 분석 결과 초기화
            dispatch(clearChat());     // 채팅 기록 초기화
        };
    }, [dispatch]); // dispatch 함수는 변경되지 않으므로 의존성 배열에 한 번만 추가

    /**
     * `chatMessages`가 업데이트될 때마다 채팅창을 가장 아래로 자동 스크롤합니다.
     */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    /**
     * 이력서 분석 요청을 처리하는 핸들러입니다.
     * API 호출을 시뮬레이션하고, 성공 또는 실패에 따라 Redux 액션을 디스패치합니다.
     * @param {object} options - 이력서 분석에 필요한 옵션 (예: resumeFile)
     */
    const analyzeResume = async (options) => {
        if (isAnalysisLoading) return; // 이미 로딩 중이면 중복 요청 방지

        dispatch(startAnalysis());       // 분석 시작 액션 디스패치 (로딩 상태 활성화)
        setIsAnalysisChatMode(false);    // 분석 시작 시 채팅 모드 비활성화

        // 실제 API 호출 대신 2초 지연을 시뮬레이션합니다.
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            // 90% 확률로 성공, 10% 확률로 실패를 시뮬레이션합니다.
            if (Math.random() > 0.1) {
                const mockResults = {
                    summary: "React와 Spring Boot 기반 웹 개발에 강점을 가진 5년차 소프트웨어 개발자로, 문제 해결 및 협업 능력이 뛰어납니다.",
                    skills: ["React.js", "Spring Boot", "JavaScript", "Java", "RESTful API", "Git", "SQL"],
                    recommendations: "백엔드 개발자, 풀스택 개발자 직무에 적합합니다.",
                    recommendedSkills: ["Kubernetes", "AWS", "Microservices"]
                };
                dispatch(analysisSuccess(mockResults)); // 분석 성공 액션 디스패치
                setIsAnalysisChatMode(true);             // 분석 성공 시 채팅 모드로 전환
                dispatch(addAiMessage(`이력서 분석이 완료되었습니다! 분석 결과에 대해 궁금한 점을 질문해보세요.`));
            } else {
                throw new Error("데모 분석 중 오류가 발생했습니다. 다시 시도해주세요.");
            }
        } catch (err) {
            const message = err.message || "알 수 없는 오류가 발생했습니다.";
            dispatch(analysisFailure(message)); // 분석 실패 액션 디스패치
            notifyError(message); // 에러 알림 표시
        }
    };

    /**
     * 모든 상태(이력서 분석 결과, 채팅 기록, 모드)를 초기화하는 핸들러입니다.
     */
    const handleClearAll = () => {
        dispatch(clearAnalysis());          // 이력서 분석 결과 초기화
        dispatch(clearChat());              // 채팅 기록 초기화
        setIsAnalysisChatMode(false);       // 분석 결과 모드로 전환
    };

    /**
     * 분석 결과 보기 모드에서 '분석 결과로 대화하기' 버튼 클릭 시 채팅 모드로 진입하는 핸들러입니다.
     */
    const handleReEnterAnalysisChat = () => setIsAnalysisChatMode(true);

    /**
     * 채팅 모드에서 '결과 보기' 버튼 클릭 시 분석 결과 모드로 돌아가는 핸들러입니다.
     */
    const handleExitAnalysisChatMode = () => setIsAnalysisChatMode(false);

    /**
     * 채팅 입력 필드에서 메시지를 전송할 때 호출되는 핸들러입니다.
     * 사용자 메시지를 추가하고 AI 응답을 시뮬레이션합니다.
     * @param {string} messageText - 사용자가 입력한 메시지 텍스트
     */
    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || isAiTyping) return; // 메시지가 비었거나 AI 타이핑 중이면 전송 방지

        dispatch(addUserMessage(messageText)); // 사용자 메시지 추가

        // AI 응답 시뮬레이션을 위해 1.5초 지연
        await new Promise(resolve => setTimeout(resolve, 1500));
        const aiFeedback = `"${messageText.substring(0, 15)}..."에 대한 AI의 데모 답변입니다.`;
        dispatch(addAiMessage(aiFeedback)); // AI 응답 메시지 추가
    };

    // 채팅 입력 컴포넌트에서 사용할 예시 질문 목록
    const exampleQuestions = [
        "이력서 요약 내용을 다시 알려줘.",
        "내 강점들을 활용할 수 있는 직무가 있을까?",
        "이력서를 바탕으로 예상 면접 질문을 해줘."
    ];

    return (
        // 전체 페이지 컨테이너 (배경 및 폰트 설정)
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-inter">
            {/* 페이지 콘텐츠를 담는 중앙 정렬 컨테이너 */}
            <div className="container mx-auto p-6 flex flex-col h-screen">
                {/* 헤더 섹션: 대시보드 링크 및 페이지 제목 */}
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

                {/* 메인 콘텐츠 영역: 왼쪽 (설정) & 오른쪽 (결과/채팅) */}
                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* 왼쪽 컬럼: 이력서 업로드 및 분석 설정 컨트롤 */}
                    <ResumeUploadSection
                        onAnalyzeProp={analyzeResume}
                        isLoading={isAnalysisLoading}
                    />

                    {/* 오른쪽 컬럼: 분석 결과 표시 또는 피드백 채팅 인터페이스 */}
                    <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
                        {!isAnalysisChatMode ? (
                            // 분석 결과 모드일 때 (AnalysisResultDisplay 컴포넌트 표시)
                            <div className="p-6 flex flex-col h-full">
                                <h2 className="text-2xl font-bold mb-4 text-center border-b border-gray-200 dark:border-gray-700 pb-4 text-gray-800 dark:text-gray-50">
                                    분석 결과
                                </h2>
                                {/* 분석 중 에러가 발생했을 때 경고 메시지 */}
                                {analysisError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4
                                                    dark:bg-red-900/50 dark:text-red-300 dark:border-red-700" role="alert">
                                        <strong className="font-bold">분석 오류:</strong>
                                        <span className="block sm:inline ml-2">{analysisError}</span>
                                    </div>
                                )}
                                {/* 이력서 분석 결과 표시 영역 */}
                                <div className="flex-grow overflow-y-auto">
                                    <AnalysisResultDisplay
                                        analysisResults={analysisResults}
                                        isLoading={isAnalysisLoading}
                                    />
                                </div>
                                {/* 분석 결과가 있거나 에러가 발생했을 때 버튼 표시 */}
                                {(analysisResults || analysisError) && (
                                    <div className="mt-4 flex justify-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                                        {analysisResults && (
                                            <button
                                                onClick={handleReEnterAnalysisChat}
                                                className="px-6 py-2 rounded-lg font-semibold bg-blue-600 text-white
                                                           hover:bg-blue-700 transition-colors"
                                            >
                                                분석 결과로 대화하기
                                            </button>
                                        )}
                                        <button
                                            onClick={handleClearAll}
                                            className="px-6 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700
                                                       hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                                        >
                                            초기화
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // 피드백 채팅 모드일 때 (ChatWindow 및 ChatInput 컴포넌트 표시)
                            <div className="flex flex-col h-full relative">
                                <div className="p-6 pb-4 text-center border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-50">
                                        이력서 분석 대화
                                    </h2>
                                    {/* 결과 보기로 돌아가기 버튼 */}
                                    <button
                                        onClick={handleExitAnalysisChatMode}
                                        className="absolute top-6 right-6 text-sm font-semibold text-gray-500 hover:text-gray-800
                                                   dark:text-gray-400 dark:hover:text-white"
                                        aria-label="분석 결과 보기로 돌아가기"
                                    >
                                        [결과 보기]
                                    </button>
                                </div>
                                {/* 채팅 메시지 창 */}
                                <ChatWindow messages={chatMessages} isThinking={isAiTyping} />
                                {/* 채팅 입력 필드 */}
                                <ChatInput
                                    onSendMessage={handleSendMessage}
                                    isLoading={isAiTyping}
                                    handleClearChat={handleClearAll} // 채팅 초기화 시 전체 초기화
                                    handleExampleQuestionClick={handleSendMessage} // 예시 질문 클릭 시 바로 전송
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