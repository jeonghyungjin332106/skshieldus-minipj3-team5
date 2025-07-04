// src/pages/ResumeAnalysisPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ContentUpload from '../components/ContentUpload';
import AnalysisResultDisplay from '../components/AnalysisResultDisplay';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

import { startAnalysis, analysisSuccess, analysisFailure, clearAnalysis } from '../features/analysis/analysisSlice';
import { addUserMessage, addAiMessage, setAiTyping, setChatError, clearChat } from '../features/chat/chatSlice';
import { notifyError } from '../components/Notification'; // notifyError 임포트


const BACKEND_API_BASE_URL = 'http://localhost:8080';

function ResumeAnalysisPage() {
  const dispatch = useDispatch();
  const { results: analysisResults, isLoading: isAnalysisLoading, error: analysisError } = useSelector((state) => state.analysis);
  const { messages: chatMessages, isAiTyping, error: chatError } = useSelector((state) => state.chat);
  const { token } = useSelector((state) => state.auth);

  const [isAnalysisChatMode, setIsAnalysisChatMode] = useState(false);
  const [currentAnalyzedResume, setCurrentAnalyzedResume] = useState(null); // 오타 수정됨

  const analyzeResume = async ({ file, text }) => {
    if (isAnalysisLoading) return;

    dispatch(startAnalysis());
    dispatch(clearChat());
    setIsAnalysisChatMode(false);

    try {
      console.log("백엔드 API 호출 시뮬레이션 시작:", file ? file.name : (text ? "텍스트 입력" : "없음"));

      await new Promise(resolve => setTimeout(resolve, 3000));

      if (Math.random() > 0.1) {
        const mockResults = {
          summary: "이력서에 따르면, 소프트웨어 개발 분야에서 5년 이상의 경력을 보유하고 있으며, 특히 React와 Spring Boot 기반의 웹 애플리케이션 개발에 강점을 보입니다. 문제 해결 능력과 팀 협업 능력이 뛰어납니다.",
          skills: ["React.js", "Spring Boot", "JavaScript", "Java", "RESTful API", "Git", "SQL"],
          recommendations: "백엔드 개발자, 풀스택 개발자, 또는 자바 기반의 엔터프라이즈 솔루션 개발 직무에 적합합니다.",
          recommendedSkills: ["Kubernetes", "AWS Cloud", "Microservices Architecture"]
        };
        dispatch(analysisSuccess(mockResults));

        setCurrentAnalyzedResume(file ? file.name : text); // 오타 수정된 함수명 사용
        setIsAnalysisChatMode(true);

        const aiIntroMessage = `이력서 분석이 완료되었습니다!\n\n` +
                               `요약: ${mockResults.summary}\n\n` +
                               `더 궁금한 점이 있으시면 자유롭게 질문해주세요.`;
        dispatch(addAiMessage(aiIntroMessage));

      } else {
        const errorMessage = "이력서 분석 중 예상치 못한 오류가 발생했습니다. 다시 시도해주세요. (데모 오류)";
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

  // --- 추가: 분석 결과로 다시 채팅 시작하는 함수 ---
  const handleReEnterAnalysisChat = () => { // <--- 이 함수 정의가 여기에 있습니다!
    if (analysisResults && !isAnalysisChatMode) {
      setIsAnalysisChatMode(true);
      dispatch(clearChat());
      const aiIntroMessage = `이전 이력서 분석 결과에 대한 대화입니다.\n\n` +
                             `요약: ${analysisResults.summary}\n\n` +
                             `무엇이 궁금하신가요?`;
      dispatch(addAiMessage(aiIntroMessage));
    }
  };
  // --------------------------------------------------

  const handleSendMessage = async (messageText) => {
    dispatch(addUserMessage(messageText));

    await new Promise(resolve => setTimeout(resolve, 2000));

    if (Math.random() > 0.1) {
      let aiResponse = `"${messageText.substring(0, 15)}..."에 대한 AI의 답변입니다:\n\n`;
      if (messageText.includes("요약") || messageText.includes("강점")) {
        aiResponse += `이력서의 주요 강점은 ${analysisResults?.skills?.join(', ') || '분석된 강점 없음'} 등이며, ${analysisResults?.summary || '요약된 내용 없음'}입니다.`;
      } else if (messageText.includes("추천 직무") || messageText.includes("어떤 직무")) {
        aiResponse += `AI는 ${analysisResults?.recommendations || '추천된 직무 없음'} 직무를 추천합니다. 관련 기술로는 ${analysisResults?.recommendedSkills?.join(', ') || '추천 기술 없음'}이 있습니다.`;
      } else {
        aiResponse += `더 구체적인 질문을 해주시면 자세히 설명해 드릴 수 있습니다. (데모 답변)`;
      }
      dispatch(addAiMessage(aiResponse));
    } else {
      const errorMessage = "AI 응답 생성 중 오류가 발생했습니다. 다시 시도해주세요. (AI 데모 오류)";
      dispatch(setChatError(errorMessage));
      dispatch(addAiMessage("죄송합니다. AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
      notifyError(errorMessage);
    }
  };

  const handleExitAnalysisChatMode = () => {
    setIsAnalysisChatMode(false);
    dispatch(clearChat());
    setCurrentAnalyzedResume(null);
  };

  return (
    // 페이지 전체 배경색 및 기본 텍스트 색상
    <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold mb-8 text-center dark:text-gray-50">
          이력서 분석
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-3">
            {!isAnalysisChatMode ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                  <ContentUpload onAnalyze={analyzeResume} isLoading={isAnalysisLoading} />
                </div>
                <div className="md:col-span-2">
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
                        // --- 이 버튼의 onClick에 handleReEnterAnalysisChat 함수가 연결되어 있습니다. ---
                        <button
                          onClick={handleReEnterAnalysisChat} // <--- 이 부분에서 호출
                          className="bg-blue-500 text-white px-5 py-2 rounded-md hover:bg-blue-600 transition-colors duration-300 dark:bg-blue-600 dark:hover:bg-blue-700"
                        >
                          분석 결과로 대화하기
                        </button>
                      )}
                      <button
                        onClick={handleClearAnalysis}
                        className="bg-gray-400 text-white px-5 py-2 rounded-md hover:bg-gray-500 transition-colors duration-300"
                      >
                        분석 결과 초기화
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 md:col-span-3 dark:bg-gray-700">
                <h2 className="text-2xl font-bold mb-4 text-center border-b pb-2 dark:text-gray-50 dark:border-gray-600">
                  이력서 분석 대화
                  <button onClick={handleExitAnalysisChatMode} className="float-right text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    [나가기]
                  </button>
                </h2>
                {chatError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-300" role="alert">
                    <strong className="font-bold">채팅 오류:</strong>
                    <span className="block sm:inline ml-2">{chatError}</span>
                  </div>
                )}
                <ChatWindow messages={chatMessages} />
                <ChatInput onSendMessage={handleSendMessage} isLoading={isAiTyping} />
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-gray-600">
          <p>이 페이지에서 이력서를 업로드하고 AI 분석 결과를 받아볼 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}

export default ResumeAnalysisPage;