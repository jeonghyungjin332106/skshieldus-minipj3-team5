// src/pages/InterviewQuestionsPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import QuestionGenerationControls from '../components/QuestionGenerationControls';
import GeneratedQuestionsDisplay from '../components/GeneratedQuestionsDisplay';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

// chatSlice의 액션들 임포트
import { addUserMessage, addAiMessage, setAiTyping, setChatError, clearChat, startQuestionChat } from '../features/chat/chatSlice';
// interviewSlice의 액션들 임포트
import {
  startQuestionGeneration,
  questionGenerationSuccess,
  questionGenerationFailure,
  clearGeneratedQuestions
} from '../features/interview/interviewSlice';
// --- 중요: notifyError 임포트 ---
import { notifyError } from '../components/Notification';


function InterviewQuestionsPage() {
  const dispatch = useDispatch();
  // Redux 스토어에서 면접 질문 생성 상태 가져오기
  const {
    generatedQuestions,
    isLoading: isLoadingQuestions,
    error: questionGenerationError
  } = useSelector((state) => state.interview);

  // 채팅 관련 Redux 상태 가져오기
  const { messages: chatMessages, isAiTyping, error: chatError } = useSelector((state) => state.chat);

  const [isChatMode, setIsChatMode] = useState(false);
  const [currentQuestionForChat, setCurrentQuestionForChat] = useState(null);

  // 질문 초기화 시 채팅도 초기화
  const handleClearAll = () => {
    dispatch(clearGeneratedQuestions()); // interviewSlice 결과 초기화
    dispatch(clearChat()); // chatSlice 메시지 초기화
    setIsChatMode(false); // 채팅 모드 종료
    setCurrentQuestionForChat(null);
  };

  // 면접 질문 생성 데모 함수 (Redux 액션 디스패치로 변경)
  const generateDemoQuestions = ({ companyName, interviewType, resumeFile }) => {
    if (isLoadingQuestions) return;

    dispatch(startQuestionGeneration()); // 질문 생성 시작 액션 디스패치
    dispatch(clearChat()); // 새 질문 생성 시 채팅 초기화
    setIsChatMode(false); // 새 질문 생성 시 채팅 모드 종료

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

        dispatch(questionGenerationSuccess(baseQuestions)); // 질문 생성 성공 액션 디스패치
      } else {
        const errorMessage = "면접 질문 생성 중 오류가 발생했습니다. 다시 시도해주세요. (데모 오류)";
        dispatch(questionGenerationFailure(errorMessage)); // 질문 생성 실패 액션 디스패치
        // --- 중요: 알림 추가 ---
        notifyError(errorMessage);
        // ---------------------
      }
    }, 3000);
  };

  // 답변 입력/피드백 버튼 클릭 시 채팅 모드 활성화
  const handleOpenFeedbackChat = (question) => {
    setIsChatMode(true);
    setCurrentQuestionForChat(question);
    dispatch(clearChat());
    dispatch(startQuestionChat(question));
  };

  // 채팅 메시지 전송 핸들러 (사용자 답변 및 AI 피드백 시뮬레이션)
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
      const errorMessage = "피드백 생성 중 오류가 발생했습니다. 다시 시도해주세요. (AI 데모 오류)";
      dispatch(setChatError(errorMessage)); // 채팅 오류 Redux 상태 업데이트
      // --- 중요: 알림 추가 ---
      notifyError(errorMessage);
      // ---------------------
      dispatch(addAiMessage("죄송합니다. 피드백 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")); // 채팅창에 오류 메시지 추가
    }
  };

  // 채팅 모드에서 나가기
  const handleExitChatMode = () => {
    setIsChatMode(false);
    setCurrentQuestionForChat(null);
    dispatch(clearChat()); // 나가기 시 채팅 메시지 초기화 (선택 사항)
  };


  return (
    // 페이지 전체 배경색 및 기본 텍스트 색상
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {/* 내부 컨테이너 배경 및 그림자 */}
      <div className="container mx-auto px-4 py-8 bg-white rounded-lg shadow-md dark:bg-gray-700">
        {/* 제목 텍스트 색상 */}
        <h1 className="text-4xl font-extrabold mb-8 text-center dark:text-gray-50">
          AI 면접 예상 질문
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 질문 생성 컨트롤 섹션 */}
          <div className="md:col-span-1">
            {/* QuestionGenerationControls 컴포넌트는 내부적으로 다크 모드 대응 */}
            <QuestionGenerationControls onGenerate={generateDemoQuestions} isLoading={isLoadingQuestions} />
          </div>

          {/* 질문 표시 또는 채팅 섹션 */}
          <div className="md:col-span-2">
            {/* 에러 메시지 박스 배경, 테두리, 텍스트 색상 */}
            {questionGenerationError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
                <strong className="font-bold">오류:</strong>
                <span className="block sm:inline ml-2">{questionGenerationError}</span>
              </div>
            )}

            {!isChatMode ? ( // 채팅 모드가 아닐 때 질문 목록 표시
              // GeneratedQuestionsDisplay 컴포넌트는 내부적으로 다크 모드 대응
              <GeneratedQuestionsDisplay
                questions={generatedQuestions}
                isLoading={isLoadingQuestions}
                error={questionGenerationError}
                onFeedbackRequest={handleOpenFeedbackChat}
              />
            ) : ( // 채팅 모드일 때 채팅 UI 표시
              // 채팅 컨테이너 배경 및 그림자
              <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-700">
                {/* 채팅 제목 텍스트 색상 및 하단 보더 색상 */}
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center border-b pb-2 dark:text-gray-50 dark:border-gray-600">
                   면접 피드백 채팅
                  <button onClick={handleExitChatMode} className="float-right text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    [나가기]
                  </button>
                </h2>
                {/* 채팅 오류 메시지 박스 배경, 테두리, 텍스트 색상 */}
                {chatError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
                    <strong className="font-bold">채팅 오류:</strong>
                    <span className="block sm:inline ml-2">{chatError}</span>
                  </div>
                )}
                {/* ChatWindow 및 ChatInput 컴포넌트들은 내부적으로 다크 모드 대응 */}
                <ChatWindow messages={chatMessages} />
                <ChatInput onSendMessage={handleSendMessage} isLoading={isAiTyping} />
              </div>
            )}

            {/* 모두 초기화 버튼 컨테이너 */}
            {(generatedQuestions || questionGenerationError || isChatMode) && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleClearAll}
                  // 버튼 배경 및 텍스트 색상 (다크 모드 적용)
                  className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-500 transition-colors duration-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                >
                  모두 초기화
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-gray-600">
          {/* 단락 텍스트 색상 */}
          <p>AI가 당신의 이력서와 면접 유형에 맞춰 예상 질문을 생성해 드립니다.</p>
        </div>
      </div>
    </div>
  );
}

export default InterviewQuestionsPage;