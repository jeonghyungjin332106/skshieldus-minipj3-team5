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

/**
 * AI 면접 예상 질문을 생성하고, 생성된 질문에 대한 피드백 채팅을 제공하는 페이지 컴포넌트입니다.
 * 사용자로부터 회사 정보 및 이력서를 받아 질문을 생성하며, 각 질문에 대해 AI와 대화하며 답변을 개선할 수 있습니다.
 */
function InterviewQuestionsPage() {
    const dispatch = useDispatch();

    // Redux 스토어에서 면접 질문 생성 관련 상태를 가져옵니다.
    const { generatedQuestions, isLoading: isLoadingQuestions, error: questionGenerationError } = useSelector((state) => state.interview);
    // Redux 스토어에서 채팅 관련 상태를 가져옵니다.
    const { messages: chatMessages, isAiTyping, error: chatError } = useSelector((state) => state.chat);

    // 컴포넌트 내부 UI 상태 관리
    const [isChatMode, setIsChatMode] = useState(false); // 질문 목록 모드(false) 또는 채팅 피드백 모드(true)
    const [currentQuestionForChat, setCurrentQuestionForChat] = useState(null); // 현재 채팅 중인 면접 질문

    // 페이지 언마운트 시 Redux 상태를 초기화합니다.
    useEffect(() => {
        return () => {
            dispatch(clearGeneratedQuestions()); // 생성된 질문 초기화
            dispatch(clearChat());              // 채팅 기록 초기화
        };
    }, [dispatch]); // dispatch 함수는 변경되지 않으므로 의존성 배열에 한 번만 추가

    /**
     * 면접 질문 생성 요청을 처리하는 핸들러입니다.
     * 유효성 검사 후 Redux 액션을 디스패치하고 API 호출을 시뮬레이션합니다.
     * @param {object} options - 질문 생성에 필요한 옵션 (companyName, resumeFile 등)
     */
    const generateQuestions = (options) => {
        if (isLoadingQuestions) return; // 이미 로딩 중이면 중복 요청 방지

        // 필수 입력값 유효성 검사
        if (!options.companyName && !options.resumeFile) {
            notifyError('회사 이름을 입력하거나 이력서 파일을 첨부해주세요.');
            return;
        }

        dispatch(startQuestionGeneration()); // 질문 생성 시작 액션 디스패치
        dispatch(clearChat());              // 새로운 질문 생성 전 채팅 초기화
        setIsChatMode(false);               // 질문 목록 모드로 전환

        // 실제 API 호출 대신 2초 후 가짜 질문 데이터를 사용하여 성공을 시뮬레이션합니다.
        setTimeout(() => {
            const mockQuestions = [
                "지원한 동기가 무엇인가요?",
                `${options.companyName}에 대해 아는 것을 말해보세요.`,
                "가장 힘들었던 프로젝트 경험과 극복 과정은?",
                "협업 시 갈등 해결 경험이 있다면 설명해주세요.",
                "우리 회사에 기여할 수 있는 부분은 무엇이라고 생각하나요?"
            ];
            dispatch(questionGenerationSuccess(mockQuestions)); // 질문 생성 성공 액션 디스패치
            // 에러 시뮬레이션: dispatch(questionGenerationFailure("질문 생성에 실패했습니다. 다시 시도해주세요."));
        }, 2000);
    };

    /**
     * '답변 입력/피드백' 버튼 클릭 시 채팅 모드로 전환하고,
     * 선택된 질문으로 채팅을 시작하도록 Redux 액션을 디스패치합니다.
     * @param {string} question - 채팅을 시작할 면접 질문 텍스트
     */
    const handleOpenFeedbackChat = (question) => {
        setIsChatMode(true);
        setCurrentQuestionForChat(question);
        dispatch(startQuestionChat(question)); // 채팅 슬라이스에 초기 질문 메시지 설정
    };

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
        dispatch(addAiMessage(`"${messageText.substring(0, 15)}..."에 대한 AI 피드백입니다.`)); // AI 응답 메시지 추가
    };

    /**
     * 채팅 모드에서 '목록으로' 버튼 클릭 시 질문 목록 모드로 돌아가는 핸들러입니다.
     * 채팅 관련 상태를 모두 초기화합니다.
     */
    const handleExitChatMode = () => {
        setIsChatMode(false);
        setCurrentQuestionForChat(null);
        dispatch(clearChat()); // 채팅 기록 초기화
    };

    /**
     * 모든 상태(생성된 질문, 채팅 기록, 모드)를 초기화하는 핸들러입니다.
     */
    const handleClearAll = () => {
        dispatch(clearGeneratedQuestions()); // 생성된 질문 초기화
        dispatch(clearChat());              // 채팅 기록 초기화
        setIsChatMode(false);               // 질문 목록 모드로 전환
        setCurrentQuestionForChat(null);    // 현재 질문 초기화
    };

    // 채팅 입력 컴포넌트에서 사용할 예시 질문 목록
    const exampleQuestions = ["답변 예시를 보여줘.", "어떤 키워드를 포함해야 할까?", "질문을 다시 요약해줘."];

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
                        AI 면접 예상 질문
                    </h1>
                </div>

                {/* 메인 콘텐츠 영역: 왼쪽 (설정) & 오른쪽 (질문/채팅) */}
                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* 왼쪽 컬럼: 질문 생성 설정 컨트롤 */}
                    <QuestionGenerationControls
                        onGenerate={generateQuestions}
                        isLoading={isLoadingQuestions}
                    />

                    {/* 오른쪽 컬럼: 생성된 질문 목록 또는 피드백 채팅 인터페이스 */}
                    <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
                        {!isChatMode ? (
                            // 질문 목록 모드일 때 (GeneratedQuestionsDisplay 컴포넌트 표시)
                            <div className="p-6 flex flex-col h-full">
                                <h2 className="text-2xl font-bold mb-4 text-center border-b border-gray-200 dark:border-gray-700 pb-4 text-gray-800 dark:text-gray-50">
                                    생성된 질문 목록
                                </h2>
                                {/* 질문 생성 중 에러가 발생했을 때 경고 메시지 */}
                                {questionGenerationError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-2 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700" role="alert">
                                        <strong className="font-bold">오류:</strong>
                                        <span className="block sm:inline ml-2">{questionGenerationError}</span>
                                    </div>
                                )}
                                {/* 생성된 질문들을 표시하는 영역 */}
                                <div className="flex-grow overflow-y-auto mt-4">
                                    <GeneratedQuestionsDisplay
                                        questions={generatedQuestions}
                                        isLoading={isLoadingQuestions}
                                        error={questionGenerationError} // GeneratedQuestionsDisplay 내부에서 에러 처리
                                        onFeedbackRequest={handleOpenFeedbackChat}
                                    />
                                </div>
                                {/* 질문이 있거나 에러가 발생했을 때 '모두 초기화' 버튼 표시 */}
                                {(generatedQuestions?.length > 0 || questionGenerationError) && (
                                    <div className="mt-4 pt-4 text-center border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                                        <button
                                            onClick={handleClearAll}
                                            className="px-6 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300
                                                       dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors"
                                        >
                                            모두 초기화
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // 피드백 채팅 모드일 때 (ChatWindow 및 ChatInput 컴포넌트 표시)
                            <div className="flex flex-col h-full relative">
                                <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-50">
                                        면접 피드백 채팅
                                    </h2>
                                    <p className="text-center text-gray-500 dark:text-gray-400 mt-1 truncate">
                                        "{currentQuestionForChat}"
                                    </p>
                                    {/* 목록으로 돌아가기 버튼 */}
                                    <button
                                        onClick={handleExitChatMode}
                                        className="absolute top-6 right-6 text-sm font-semibold text-gray-500 hover:text-gray-800
                                                   dark:text-gray-400 dark:hover:text-white"
                                    >
                                        [목록으로]
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

export default InterviewQuestionsPage;