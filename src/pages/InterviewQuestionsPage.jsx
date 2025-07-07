// src/pages/InterviewQuestionsPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// ContentUpload import 제거
// import ContentUpload from '../components/ContentUpload'; // 이 줄을 제거합니다.
import QuestionGenerationControls from '../components/QuestionGenerationControls'; // 이제 모든 기능을 포함
import GeneratedQuestionsDisplay from '../components/GeneratedQuestionsDisplay';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

import { addUserMessage, addAiMessage, setAiTyping, setChatError, clearChat, startQuestionChat } from '../features/chat/chatSlice';
import {
    startQuestionGeneration,
    questionGenerationSuccess,
    questionGenerationFailure,
    clearGeneratedQuestions
} from '../features/interview/interviewSlice';
import { notifyError } from '../components/Notification';


function InterviewQuestionsPage() {
    const dispatch = useDispatch();

    const {
        generatedQuestions,
        isLoading: isLoadingQuestions,
        error: questionGenerationError
    } = useSelector((state) => state.interview);

    const { messages: chatMessages, isAiTyping, error: chatError } = useSelector((state) => state.chat);

    const [isChatMode, setIsChatMode] = useState(false);
    const [currentQuestionForChat, setCurrentQuestionForChat] = useState(null);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const handleClearAll = () => {
        dispatch(clearGeneratedQuestions());
        dispatch(clearChat());
        setIsChatMode(false);
        setCurrentQuestionForChat(null);
        // QuestionGenerationControls의 상태는 내부적으로 관리되므로 여기서 직접 초기화하지 않습니다.
        // 만약 QuestionGenerationControls을 리셋하고 싶다면, key prop을 변경하거나 reset 함수를 전달해야 합니다.
    };

    // 이 함수가 QuestionGenerationControls로부터 모든 필요한 파라미터를 받습니다.
    const generateQuestions = ({ companyName, interviewType, resumeFile, chunkSize, chunkOverlap, temperature }) => {
        if (isLoadingQuestions) return;

        // 질문 생성을 위한 필수 조건 (예: 최소 회사 이름 또는 이력서 파일)
        if (!companyName && !resumeFile) {
            notifyError('회사 이름을 입력하거나 이력서 파일을 첨부해주세요.');
            return;
        }

        dispatch(startQuestionGeneration());
        dispatch(clearChat());
        setIsChatMode(false);

        console.log(`질문 생성 요청: 회사=${companyName}, 유형=${interviewType}, 이력서=${resumeFile ? resumeFile.name : "없음"}, 청크=${chunkSize}, 오버랩=${chunkOverlap}, 온도=${temperature}`);

        setTimeout(() => {
            if (Math.random() > 0.15) {
                const baseQuestions = [];
                if (interviewType === 'technical') {
                    baseQuestions.push("자바스크립트의 비동기 처리에 대해 설명하고, 콜백 함수, Promise, Async/Await의 차이점을 설명하세요.");
                    baseQuestions.push("RESTful API 설계 원칙에 대해 아는 대로 설명하세요.");
                    baseQuestions.push("데이터베이스 정규화(Normalization)의 목적과 장단점을 설명하세요.");
                } else if (interviewType === 'behavioral') {
                    baseQuestions.push("팀 프로젝트 중 갈등 상황이 발생했을 때 어떻게 해결했는지 경험을 공유해주세요.");
                    baseQuestions.push("가장 힘들었던 실패 경험과 그를 통해 무엇을 배웠는지 이야기해주세요.");
                    baseQuestions.push("저희 회사에 지원한 동기가 무엇인가요?");
                } else { // general
                    baseQuestions.push("저희 회사에 지원한 동기가 무엇인가요?");
                    baseQuestions.push("자신을 한 단어로 표현한다면 무엇이며, 그 이유는 무엇인가요?");
                    baseQuestions.push("가장 존경하는 인물은 누구이며, 그 이유는 무엇인가요?");
                }

                if (companyName) {
                    baseQuestions.push(`${companyName}의 서비스/제품에 대해 아는 대로 설명하고, 개선할 점이 있다면 무엇일까요?`);
                }
                if (resumeFile) {
                    baseQuestions.push(`이력서 파일(${resumeFile.name})의 내용을 바탕으로 특정 경험에 대해 더 자세히 설명해주세요.`);
                }

                dispatch(questionGenerationSuccess(baseQuestions));
            } else {
                const errorMessage = "면접 질문 생성 중 오류가 발생했습니다. 다시 시도해주세요. (데모 오류)";
                dispatch(questionGenerationFailure(errorMessage));
                notifyError(errorMessage);
            }
        }, 3000);
    };

    const handleOpenFeedbackChat = (question) => {
        setIsChatMode(true);
        setCurrentQuestionForChat(question);
        dispatch(clearChat());
        dispatch(startQuestionChat(question));
    };

    const handleSendMessage = async (messageText) => {
        if (messageText.trim() === '') return;

        dispatch(addUserMessage(messageText));

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (Math.random() > 0.1) {
            const aiFeedback = `"${messageText.substring(0, Math.min(messageText.length, 15))}..."에 대한 AI 피드백입니다:\n\n` +
                               `👍 답변이 질문의 핵심을 잘 파악하고 있습니다.\n` +
                               `🤔 구체적인 경험이나 수치를 추가하면 더욱 설득력이 높아질 것입니다.\n` +
                               `📈 관련 질문: ${currentQuestionForChat ? `'${currentQuestionForChat}'에 대해 더 궁금한 점이 있으신가요?` : "다른 질문에 대해 더 알고 싶으신가요?"}`;
            
            dispatch(addAiMessage(aiFeedback));
        } else {
            const errorMessage = "피드백 생성 중 오류가 발생했습니다. 다시 시도해주세요. (AI 데모 오류)";
            dispatch(setChatError(errorMessage));
            notifyError(errorMessage);
            dispatch(addAiMessage("죄송합니다. 피드백 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
        }
    };

    const handleExitChatMode = () => {
        setIsChatMode(false);
        setCurrentQuestionForChat(null);
        dispatch(clearChat());
    };

    const exampleQuestions = [
        "이 질문에 대한 답변 예시를 보여줘.",
        "이 질문에 어떤 키워드를 포함해야 할까?",
        "이 질문을 다시 한번 요약해줘."
    ];


    return (
        <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="container mx-auto px-4 py-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <h1 className="text-4xl font-extrabold mb-8 text-center dark:text-gray-50">
                    AI 면접 예상 질문
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* 왼쪽 컬럼: QuestionGenerationControls만 배치 */}
                    <div className="md:col-span-1"> {/* flex-col과 gap-6은 QuestionGenerationControls 내부에서 관리 */}
                        <QuestionGenerationControls
                            onGenerate={generateQuestions} // QuestionGenerationControls로부터 모든 파라미터 받음
                            isLoading={isLoadingQuestions}
                        />
                    </div>

                    {/* 오른쪽 컬럼: 질문 표시 또는 채팅 섹션 */}
                    <div className="md:col-span-2">
                        {questionGenerationError && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
                                <strong className="font-bold">오류:</strong>
                                <span className="block sm:inline ml-2">{questionGenerationError}</span>
                            </div>
                        )}

                        {!isChatMode ? ( // 채팅 모드가 아닐 때 (질문 목록 표시)
                            <GeneratedQuestionsDisplay
                                questions={generatedQuestions}
                                isLoading={isLoadingQuestions}
                                error={questionGenerationError}
                                onFeedbackRequest={handleOpenFeedbackChat} // 피드백 요청 시 채팅 모드 활성화
                            />
                        ) : ( // 채팅 모드일 때 (채팅 UI 표시)
                            <div className="flex flex-col h-full">
                                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center border-b pb-2 dark:text-gray-50 dark:border-gray-600">
                                    면접 피드백 채팅
                                    <button onClick={handleExitChatMode} className="float-right text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                        [나가기]
                                    </button>
                                </h2>
                                {chatError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
                                        <strong className="font-bold">채팅 오류:</strong>
                                        <span className="block sm:inline ml-2">{chatError}</span>
                                    </div>
                                )}
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

                        {(generatedQuestions || questionGenerationError || isChatMode) && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={handleClearAll}
                                    className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-500 transition-colors duration-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                                >
                                    모두 초기화
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 text-center text-gray-600 dark:text-gray-400">
                    <p>AI가 당신의 이력서와 면접 유형에 맞춰 예상 질문을 생성해 드립니다.</p>
                </div>
            </div>
        </div>
    );
}

export default InterviewQuestionsPage;