// src/pages/InterviewQuestionsPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import QuestionGenerationControls from '../components/QuestionGenerationControls';
import GeneratedQuestionsDisplay from '../components/GeneratedQuestionsDisplay';
// import FeedbackModal from '../components/FeedbackModal'; // FeedbackModal 임포트 제거 (이미 제거됨)

// Chat 컴포넌트 임포트
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

// chatSlice의 액션들 임포트
import { addUserMessage, addAiMessage, setAiTyping, setChatError, clearChat, startQuestionChat } from '../features/chat/chatSlice';

function InterviewQuestionsPage() {
  const dispatch = useDispatch();
  // 면접 질문 생성 관련 로컬 상태 (Redux 연동은 다음 단계에서)
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false); // 질문 생성 로딩
  const [questionGenerationError, setQuestionGenerationError] = useState(null);

  // --- 채팅 관련 Redux 상태 가져오기 ---
  const { messages: chatMessages, isAiTyping, error: chatError } = useSelector((state) => state.chat);

  // --- 채팅 모드 관리 상태 ---
  const [isChatMode, setIsChatMode] = useState(false); // 채팅 모드 활성화 여부
  const [currentQuestionForChat, setCurrentQuestionForChat] = useState(null); // 현재 채팅 중인 질문

  // 질문 초기화 시 채팅도 초기화
  const clearQuestions = () => {
    setGeneratedQuestions(null);
    setIsLoadingQuestions(false);
    setQuestionGenerationError(null);
    dispatch(clearChat()); // 채팅 메시지 초기화
    setIsChatMode(false); // 채팅 모드 종료
    setCurrentQuestionForChat(null);
  };

  // 면접 질문 생성 데모 함수 (기존과 동일)
  const generateDemoQuestions = ({ companyName, interviewType, resumeFile }) => {
    if (isLoadingQuestions) return;

    setIsLoadingQuestions(true);
    setGeneratedQuestions(null);
    setQuestionGenerationError(null);
    dispatch(clearChat()); // 새 질문 생성 시 채팅 초기화 (선택 사항)
    setIsChatMode(false); // 채팅 모드 종료 (선택 사항)

    console.log(`질문 생성 요청: 회사=${companyName}, 유형=${interviewType}, 이력서=${resumeFile ? resumeFile.name : '없음'}`);

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

        setGeneratedQuestions(baseQuestions);
        setIsLoadingQuestions(false);
      } else {
        setQuestionGenerationError("면접 질문 생성 중 오류가 발생했습니다. 다시 시도해주세요. (데모 오류)");
        setIsLoadingQuestions(false);
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
    dispatch(addUserMessage(messageText));

    await new Promise(resolve => setTimeout(resolve, 2000));

    if (Math.random() > 0.1) {
      const aiFeedback = `"${messageText.substring(0, 15)}..."에 대한 AI 피드백입니다:\n\n` +
                         `👍 답변이 질문의 핵심을 잘 파악하고 있습니다.\n` +
                         `🤔 구체적인 경험이나 수치를 추가하면 더욱 설득력이 높아질 것입니다.\n` +
                         `📈 추가 질문: ${currentQuestionForChat || "다른 질문에 대해 더 알고 싶으신가요?"}`;
      dispatch(addAiMessage(aiFeedback));
    } else {
      dispatch(setChatError("피드백 생성 중 오류가 발생했습니다. 다시 시도해주세요. (AI 데모 오류)"));
      dispatch(addAiMessage("죄송합니다. 피드백 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
    }
  };

  const handleExitChatMode = () => {
    setIsChatMode(false);
    setCurrentQuestionForChat(null);
    dispatch(clearChat());
  };

  return (
    // --- 중요: 이 div에 dark:bg-gray-800과 dark:text-gray-100 클래스를 추가합니다. ---
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-8 bg-white rounded-lg shadow-md dark:bg-gray-700"> {/* 내부 컨테이너 배경 */}
        <h1 className="text-4xl font-extrabold mb-8 text-center dark:text-gray-50"> {/* 텍스트 색상 */}
          AI 면접 예상 질문
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 질문 생성 컨트롤 섹션 */}
          {/* QuestionGenerationControls도 내부적으로 다크모드 대응 필요 */}
          <div className="md:col-span-1">
            <QuestionGenerationControls onGenerate={generateDemoQuestions} isLoading={isLoadingQuestions} />
          </div>

          {/* 질문 표시 또는 채팅 섹션 */}
          <div className="md:col-span-2">
            {questionGenerationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
                <strong className="font-bold">오류:</strong>
                <span className="block sm:inline ml-2">{questionGenerationError}</span>
              </div>
            )}

            {!isChatMode ? ( // 채팅 모드가 아닐 때 질문 목록 표시
              // GeneratedQuestionsDisplay도 내부적으로 다크모드 대응 필요
              <GeneratedQuestionsDisplay
                questions={generatedQuestions}
                isLoading={isLoadingQuestions}
                error={questionGenerationError}
                onFeedbackRequest={handleOpenFeedbackChat}
              />
            ) : ( // 채팅 모드일 때 채팅 UI 표시
              // 채팅 컨테이너 배경과 텍스트 색상 다크모드 적용
              <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-center border-b pb-2 dark:text-gray-50 dark:border-gray-600"> {/* 텍스트, 보더 색상 */}
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
                {/* ChatWindow 및 ChatInput 내부도 다크모드 대응 필요 */}
                <ChatWindow messages={chatMessages} />
                <ChatInput onSendMessage={handleSendMessage} isLoading={isAiTyping} />
              </div>
            )}

            {(generatedQuestions || questionGenerationError || isChatMode) && (
              <div className="mt-4 text-center">
                <button
                  onClick={clearQuestions}
                  className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-500 transition-colors duration-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                >
                  모두 초기화
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 text-lg dark:text-gray-300">
            AI가 당신의 이력서와 면접 유형에 맞춰 예상 질문을 생성해 드립니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default InterviewQuestionsPage;