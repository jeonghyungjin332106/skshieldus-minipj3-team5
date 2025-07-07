// src/pages/ResumeAnalysisPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// 필요한 컴포넌트들을 임포트합니다.
import ContentUpload from '../components/ContentUpload';        // 이력서 파일/텍스트 업로드 및 고급 설정 컴포넌트
import AnalysisResultDisplay from '../components/AnalysisResultDisplay'; // 분석 결과 표시 컴포넌트
import ChatWindow from '../components/ChatWindow';              // 챗봇 메시지 표시 컴포넌트
import ChatInput from '../components/ChatInput';                // 챗봇 입력 컴포넌트

// Redux 슬라이스 액션들을 임포트합니다.
import { startAnalysis, analysisSuccess, analysisFailure, clearAnalysis } from '../features/analysis/analysisSlice';
import { addUserMessage, addAiMessage, setAiTyping, setChatError, clearChat } from '../features/chat/chatSlice';

// 사용자 알림 컴포넌트를 임포트합니다.
import { notifyError } from '../components/Notification';


// 백엔드 API 기본 URL (데모 시뮬레이션에서는 직접 사용되지 않음)
const BACKEND_API_BASE_URL = 'http://localhost:8080';

function ResumeAnalysisPage() {
    const dispatch = useDispatch(); // Redux dispatch 훅을 사용하여 액션을 디스패치합니다.

    // Redux 스토어에서 이력서 분석 관련 상태를 가져옵니다.
    const { 
        results: analysisResults,    // 이력서 분석 결과 데이터
        isLoading: isAnalysisLoading, // 분석 작업 로딩 상태 (true/false)
        error: analysisError         // 분석 중 발생한 오류 메시지
    } = useSelector((state) => state.analysis); // 'analysis' Redux 슬라이스에서 상태를 선택합니다.

    // Redux 스토어에서 채팅 관련 상태를 가져옵니다.
    const { 
        messages: chatMessages, // 채팅 메시지 목록 (사용자/AI 메시지 포함)
        isAiTyping,             // AI가 현재 응답을 생성 중인지 여부 (true/false)
        error: chatError        // 채팅 중 발생한 오류 메시지
    } = useSelector((state) => state.chat); // 'chat' Redux 슬라이스에서 상태를 선택합니다.

    // Redux 스토어에서 인증 토큰을 가져옵니다 (필요시 사용).
    const { token } = useSelector((state) => state.auth); // 'auth' Redux 슬라이스에서 토큰을 선택합니다.

    // 컴포넌트 자체의 로컬 상태를 관리합니다.
    const [isAnalysisChatMode, setIsAnalysisChatMode] = useState(false); // 이력서 분석 후 채팅 모드인지 여부
    const [currentAnalyzedResume, setCurrentAnalyzedResume] = useState(null); // 현재 분석된 이력서의 정보 (예: 파일명, 텍스트 요약)

    // 채팅 메시지 영역의 스크롤을 최하단으로 자동 이동시키기 위한 Ref입니다.
    const messagesEndRef = useRef(null);

    // `chatMessages` 배열이 업데이트(새 메시지 추가)될 때마다 스크롤을 최하단으로 이동시킵니다.
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    /**
     * 이력서 분석 요청을 처리하는 비동기 함수입니다.
     * ContentUpload 컴포넌트의 onAnalyze prop으로 전달됩니다.
     * @param {object} options - 분석에 필요한 옵션 (파일 객체, 텍스트 내용, 청크 크기, 청크 중복, 창의성 수준)
     */
    const analyzeResume = async ({ file, text, chunkSize, chunkOverlap, temperature }) => {
        if (isAnalysisLoading) return; // 이미 분석 중이라면 함수 실행을 중단합니다.

        dispatch(startAnalysis()); // Redux: 분석 시작 액션을 디스패치하여 로딩 상태로 변경합니다.
        dispatch(clearChat());     // 새 분석을 시작하므로 기존 채팅 메시지를 초기화합니다.
        setIsAnalysisChatMode(false); // 채팅 모드를 비활성화하여 분석 결과 화면으로 전환합니다.

        console.log("백엔드 API 호출 시뮬레이션 시작:", file ? file.name : (text ? "텍스트 입력" : "없음"));
        console.log("고급 설정:", { chunkSize, chunkOverlap, temperature }); // 전달된 고급 설정 값을 콘솔에 출력합니다.

        // 실제 백엔드 API 호출 대신 3초 지연을 시뮬레이션합니다.
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            // 10% 확률로 오류를 발생시켜 실패 시나리오를 시뮬레이션합니다.
            if (Math.random() > 0.1) {
                const mockResults = { // 성공 시 반환할 모의(mock) 분석 결과 데이터입니다.
                    summary: "이력서에 따르면, 소프트웨어 개발 분야에서 5년 이상의 경력을 보유하고 있으며, 특히 React와 Spring Boot 기반의 웹 애플리케이션 개발에 강점을 보입니다. 문제 해결 능력과 팀 협업 능력이 뛰어납니다.",
                    skills: ["React.js", "Spring Boot", "JavaScript", "Java", "RESTful API", "Git", "SQL"],
                    recommendations: "백엔드 개발자, 풀스택 개발자, 또는 자바 기반의 엔터프라이즈 솔루션 개발 직무에 적합합니다.",
                    recommendedSkills: ["Kubernetes", "AWS Cloud", "Microservices Architecture"]
                };
                dispatch(analysisSuccess(mockResults)); // Redux: 분석 성공 액션을 디스패치하고 결과를 전달합니다.

                // 분석된 이력서 정보(파일명 또는 텍스트 요약)를 설정하고 채팅 모드를 활성화합니다.
                setCurrentAnalyzedResume(file ? file.name : (text ? "직접 입력 텍스트" : null));
                setIsAnalysisChatMode(true);

                // AI의 초기 인사말 메시지를 생성하고 채팅창에 추가합니다.
                const aiIntroMessage = `이력서 분석이 완료되었습니다!\n\n` +
                                       `요약: ${mockResults.summary}\n\n` +
                                       `더 궁금한 점이 있으시면 자유롭게 질문해주세요.`;
                dispatch(addAiMessage(aiIntroMessage)); // Redux: AI 메시지 추가 액션을 디스패치합니다.

            } else {
                const errorMessage = "이력서 분석 중 예상치 못한 오류가 발생했습니다. 다시 시도해주세요. (데모 오류)";
                throw new Error(errorMessage); // 오류를 발생시킵니다.
            }
        } catch (err) {
            console.error("이력서 분석 시뮬레이션 오류:", err); // 콘솔에 오류를 출력합니다.
            dispatch(analysisFailure(err.message || "알 수 없는 오류가 발생했습니다. (데모 오류)")); // Redux: 분석 실패 액션을 디스패치합니다.
            notifyError(err.message || "이력서 분석 중 알 수 없는 오류 발생!"); // 사용자에게 오류 알림을 표시합니다.
            setIsAnalysisChatMode(false); // 오류 발생 시 채팅 모드를 종료합니다.
            dispatch(setChatError(err.message || "채팅 오류 발생")); // Redux: 채팅 오류 상태를 업데이트합니다.
        }
    };

    /**
     * 분석 결과 및 채팅 기록을 초기화하는 함수입니다.
     */
    const handleClearAnalysis = () => {
        dispatch(clearAnalysis()); // Redux: 분석 결과를 초기화합니다.
        dispatch(clearChat());     // Redux: 채팅 메시지를 초기화합니다.
        setIsAnalysisChatMode(false); // 채팅 모드를 종료합니다.
        setCurrentAnalyzedResume(null); // 현재 분석된 이력서 정보를 초기화합니다.
    };

    /**
     * 분석 결과가 있는 상태에서 다시 채팅 모드로 진입합니다.
     */
    const handleReEnterAnalysisChat = () => {
        // 분석 결과가 존재하고 현재 채팅 모드가 아니라면
        if (analysisResults && !isAnalysisChatMode) {
            setIsAnalysisChatMode(true); // 채팅 모드를 활성화합니다.
            dispatch(clearChat());       // 새로운 채팅 세션을 시작하기 위해 기존 메시지를 초기화합니다.
            // AI의 초기 인사말 메시지를 생성하고 채팅창에 추가합니다. (이전 분석 결과 요약 포함)
            const aiIntroMessage = `이전 이력서 분석 결과에 대한 대화입니다.\n\n` +
                                   `요약: ${analysisResults.summary}\n\n` +
                                   `무엇이 궁금하신가요?`;
            dispatch(addAiMessage(aiIntroMessage)); // Redux: AI 메시지 추가 액션을 디스패치합니다.
        }
    };

    /**
     * 채팅 메시지 전송 및 AI 응답 시뮬레이션 핸들러입니다.
     * ChatInput 컴포넌트의 onSendMessage prop으로 전달됩니다.
     * @param {string} messageText - 사용자가 전송한 메시지 내용
     */
    const handleSendMessage = async (messageText) => {
        if (messageText.trim() === '') return; // 빈 메시지라면 전송하지 않습니다.

        dispatch(addUserMessage(messageText)); // Redux: 사용자 메시지 추가 액션을 디스패치합니다.
        dispatch(setAiTyping(true));           // Redux: AI 응답 생성 중 상태로 변경합니다.

        // 실제 백엔드 API 호출 대신 3초 지연을 시뮬레이션합니다.
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            let aiResponseContent = ""; // AI 응답 내용을 담을 변수입니다.

            const lowerCaseMessage = messageText.toLowerCase(); // 메시지를 소문자로 변환하여 키워드를 비교합니다.

            // 키워드에 따른 데모 응답 로직입니다.
            if (lowerCaseMessage.includes("요약") || lowerCaseMessage.includes("강점")) {
                aiResponseContent = `이력서의 주요 강점은 ${analysisResults?.skills?.join(', ') || '분석된 강점 없음'} 등이며, ${analysisResults?.summary || '요약된 내용 없음'}입니다.`;
            } else if (lowerCaseMessage.includes("추천 직무") || lowerCaseMessage.includes("어떤 직무")) {
                const jobs = analysisResults?.recommendations ? analysisResults.recommendations.split(', ') : ["백엔드 개발자 (Java)", "클라우드 아키텍트", "DevOps 엔지니어"];
                const skills = analysisResults?.recommendedSkills || ["Spring Boot", "AWS", "Docker", "Kubernetes", "CI/CD"];
                
                aiResponseContent = "이력서 분석 결과, 귀하의 경력과 기술 스택을 바탕으로 다음 직무들을 추천합니다:\n\n";
                aiResponseContent += "**✨ 추천 직무:**\n";
                jobs.forEach(job => aiResponseContent += `- ${job}\n`);
                aiResponseContent += "\n**🛠️ 필요 기술 스택:**\n";
                skills.forEach(skill => aiResponseContent += `- ${skill}\n`);
                aiResponseContent += "\n이 추천 직무와 기술 스택에 대해 더 자세히 알고 싶으신가요?";

            } else if (lowerCaseMessage.includes("면접 질문") || lowerCaseMessage.includes("면접 준비")) {
                const questions = [
                    { question: "자신을 한 단어로 표현하고 그 이유를 설명하세요.", guidance: "핵심 역량과 가치관을 연결하여 간결하게 표현" },
                    { question: "가장 어려웠던 프로젝트 경험과 해결 과정을 설명해주세요.", guidance: "문제 정의, 해결 과정, 배운 점을 STAR 기법으로 설명" },
                    { question: "저희 회사에 지원한 동기가 무엇인가요?", guidance: "회사에 대한 깊은 이해와 본인의 성장 목표 연결" },
                    { question: "기술 면접: RESTful API의 원칙과 설계 시 고려사항은 무엇인가요?", guidance: "무상태성, 균일한 인터페이스, 계층화된 시스템 등 설명" }
                ];
                aiResponseContent = "요청하신 면접 유형에 맞춰 예상 질문을 생성했습니다:\n\n";
                questions.forEach((q, idx) => {
                    aiResponseContent += `${idx + 1}. **${q.question}**\n`;
                    if (q.guidance) {
                        aiResponseContent += `   💡 *${q.guidance}*\n`;
                    }
                });
                aiResponseContent += `\n**🗣️ 전반적인 답변 가이드라인:** 각 질문에 대해 구체적인 경험과 사례를 들어 답변을 준비하세요. 회사의 인재상과 핵심 가치를 파악하는 것이 중요합니다.\n`;
                aiResponseContent += "\n이 질문들에 대해 답변 연습을 도와드릴까요?";

            } else if (lowerCaseMessage.includes("데이터 분석가") || lowerCaseMessage.includes("데이터 분석가가 되려면")) {
                aiResponseContent = "데이터 분석가가 되기 위해서는 다양한 기술과 역량이 필요합니다. 주요 기술 스택은 다음과 같습니다:\n\n";
                aiResponseContent += "**📊 핵심 기술 스택:**\n";
                aiResponseContent += "- **프로그래밍 언어:** Python (Pandas, NumPy, Scikit-learn), R\n";
                aiResponseContent += "- **데이터베이스:** SQL (관계형 데이터베이스), NoSQL\n";
                aiResponseContent += "- **통계 및 수학:** 통계적 추론, 회귀 분석, 가설 검정 등\n";
                aiResponseContent += "- **데이터 시각화:** Tableau, Power BI, Matplotlib, Seaborn\n";
                aiResponseContent += "- **머신러닝:** 지도 학습, 비지도 학습, 딥러닝 기본 개념\n";
                aiResponseContent += "- **클라우드 플랫폼:** AWS, GCP, Azure (데이터 관련 서비스 이해)\n";
                aiResponseContent += "\n이 외에도 비즈니스 도메인 지식, 커뮤니케이션 능력, 문제 해결 능력 등이 중요합니다. 어떤 기술에 대해 더 자세히 알아보고 싶으신가요?";
            
            } else if (lowerCaseMessage.includes("안녕하세요") || lowerCaseMessage.includes("안녕")) {
                aiResponseContent = "안녕하세요! AI 커리어 챗봇입니다. 😊\n무엇을 도와드릴까요? 이력서를 업로드하거나, 궁금한 점을 질문해주세요. 예를 들어 '내 이력서 분석해줘' 또는 '면접 질문 알려줘'라고 물어볼 수 있습니다.";
            } else if (lowerCaseMessage.includes("기술 스택") || lowerCaseMessage.includes("필요한 기술")) {
                aiResponseContent = "어떤 분야의 기술 스택이 궁금하신가요? 예를 들어 '프론트엔드 개발에 필요한 기술 스택'이라고 구체적으로 질문해주시거나, 이력서를 업로드하시면 맞춤 추천을 해드릴 수 있습니다.";
            } else if (lowerCaseMessage.includes("감사합니다") || lowerCaseMessage.includes("고마워")) {
                aiResponseContent = "천만에요! 언제든지 다시 찾아주세요. 더 궁금한 점이 있으시면 편하게 질문해주세요. 😊";
            } else if (lowerCaseMessage.includes("도와줘") || lowerCaseMessage.includes("도움")) {
                aiResponseContent = "네, 무엇을 도와드릴까요? 이력서 분석, 직무 추천, 면접 질문 생성 등 다양한 방식으로 커리어 상담을 도와드릴 수 있습니다. 구체적으로 어떤 도움이 필요하신가요?";
            }
            else {
                aiResponseContent = `"${messageText.substring(0, Math.min(messageText.length, 15))}..."에 대해 답변을 준비 중입니다. 잠시만 기다려 주세요. (데모 응답)\n\n더 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.`;
            }

            // 10% 확률로 오류를 발생시켜 실패 시나리오를 시뮬레이션합니다.
            if (Math.random() < 0.1) {
                throw new Error("데모 AI 서비스 오류가 발생했습니다.");
            }

            dispatch(addAiMessage(aiResponseContent)); // Redux: AI 메시지 추가 액션을 디스패치합니다.

        } catch (error) {
            console.error('AI 챗봇 응답 오류 (데모):', error); // 콘솔에 오류를 출력합니다.
            dispatch(setChatError(`죄송합니다. 데모 AI 서비스 오류가 발생했습니다: ${error.message}. 다시 시도해주세요.`)); // Redux: 채팅 오류 상태를 업데이트합니다.
            dispatch(addAiMessage(`죄송합니다. AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. (오류: ${error.message})`)); // 채팅창에 오류 메시지를 추가합니다.
            notifyError(`AI 응답 생성 중 오류: ${error.message}`); // 사용자에게 오류 알림을 표시합니다.
        } finally {
            dispatch(setAiTyping(false)); // Redux: AI 응답 생성 중 상태를 종료합니다.
        }
    };

    /**
     * 예시 질문 클릭 핸들러입니다.
     * ChatInput 컴포넌트의 handleExampleQuestionClick prop으로 전달됩니다.
     * @param {string} question - 클릭된 예시 질문 내용
     */
    const handleExampleQuestionClick = (question) => {
        // 예시 질문 클릭 시 해당 질문을 바로 전송하도록 handleSendMessage 함수를 호출합니다.
        handleSendMessage(question);
    };

    /**
     * 채팅 모드에서 나가기 위한 함수입니다.
     * 이력서 분석 대화창의 "[나가기]" 버튼에 연결됩니다.
     */
    const handleExitAnalysisChatMode = () => { // <--- 이 함수가 여기에 정의되어 있습니다!
        setIsAnalysisChatMode(false); // 채팅 모드를 종료합니다.
        dispatch(clearChat());       // 채팅 메시지를 초기화합니다.
        setCurrentAnalyzedResume(null); // 현재 분석된 이력서 정보를 초기화합니다.
    };

    // ChatInput 컴포넌트로 전달될 예시 질문 배열입니다.
    const exampleQuestions = [
        "이력서 요약 내용을 다시 알려줘.",
        "내 강점들을 활용할 수 있는 직무가 있을까?",
        "이력서를 바탕으로 예상 면접 질문을 해줘."
    ];


    return (
        // 페이지 전체 배경색 및 기본 텍스트 색상을 설정합니다. (다크 모드 지원)
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-inter p-6
                        dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
            <div className="container mx-auto px-4 py-8">
                {/* 페이지 제목을 설정합니다. (다크 모드 지원) */}
                <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900 dark:text-gray-50">
                    AI 이력서 분석 & 커리어 챗봇
                </h1>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* 왼쪽 컬럼: ContentUpload 컴포넌트 (이력서 파일/텍스트 입력 및 고급 설정) */}
                    {/* ContentUpload는 자체적으로 모든 관련 상태와 UI를 관리합니다. */}
                    <div className="md:col-span-1">
                        <ContentUpload onAnalyze={analyzeResume} isLoading={isAnalysisLoading} />
                    </div>

                    {/* 오른쪽 컬럼: 분석 결과 표시 또는 채팅 인터페이스 */}
                    <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 p-6
                                   dark:bg-gray-700 dark:border-gray-600">
                        {!isAnalysisChatMode ? ( // 분석 후 채팅 모드가 아닐 때 (분석 결과 표시 섹션)
                            <>
                                {/* 분석 결과 섹션의 제목을 설정합니다. (다크 모드 지원) */}
                                <h2 className="text-2xl font-bold mb-4 text-center border-b pb-2 text-gray-800 dark:text-gray-50 dark:border-gray-600">
                                    분석 결과
                                </h2>
                                {/*
                                    이전에 중복되던 "아직 분석된 이력서가 없습니다." div는 AnalysisResultDisplay 컴포넌트가
                                    이 역할을 담당하도록 수정되었으므로 여기서는 제거되었습니다.
                                */}
                                
                                {/* 분석 오류 메시지를 표시합니다. (다크 모드 지원) */}
                                {analysisError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                        <strong className="font-bold">분석 오류:</strong>
                                        <span className="block sm:inline ml-2">{analysisError}</span>
                                    </div>
                                )}
                                {/* AnalysisResultDisplay 컴포넌트: 이력서 분석 결과를 표시합니다. */}
                                {/* 이 컴포넌트는 내부적으로 분석 결과가 없을 때의 메시지와 로딩 상태를 처리합니다. */}
                                <AnalysisResultDisplay
                                    analysisResults={analysisResults}
                                    isLoading={isAnalysisLoading}
                                />
                                {/* 분석 결과가 있거나 오류가 발생했을 때 초기화 및 대화하기 버튼을 표시합니다. (다크 모드 지원) */}
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
                        ) : ( // 분석 후 채팅 모드일 때 (챗봇 UI 표시 섹션)
                            <div className="flex flex-col h-full">
                                {/* 채팅 섹션의 제목 및 나가기 버튼을 설정합니다. (다크 모드 지원) */}
                                <h2 className="text-2xl font-bold mb-4 text-center border-b pb-2 text-gray-800 dark:text-gray-50 dark:border-gray-600">
                                    이력서 분석 대화
                                    <button onClick={handleExitAnalysisChatMode} className="float-right text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                        [나가기]
                                    </button>
                                </h2>
                                {/* 채팅 오류 메시지를 표시합니다. (다크 모드 지원) */}
                                {chatError && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                                        <strong className="font-bold">채팅 오류:</strong>
                                        <span className="block sm:inline ml-2">{chatError}</span>
                                    </div>
                                )}
                                {/* ChatWindow 컴포넌트: 채팅 메시지 목록을 표시합니다. */}
                                {/* ChatWindow는 자체적으로 사용자/AI 메시지 정렬 및 다크 모드 스타일을 포함합니다. */}
                                <ChatWindow messages={chatMessages} isThinking={isAiTyping} messagesEndRef={messagesEndRef} />
                                
                                {/* ChatInput 컴포넌트: 메시지 입력 필드와 전송 버튼, 예시 질문 버튼을 제공합니다. */}
                                {/* ChatInput은 자체적으로 currentMessage 상태를 관리하며 다크 모드 스타일을 포함합니다. */}
                                <ChatInput
                                    onSendMessage={handleSendMessage}        // 메시지 전송 핸들러
                                    isLoading={isAiTyping}                  // AI 로딩 상태 전달
                                    handleClearChat={handleClearAnalysis}   // "채팅 초기화" 버튼에 연결된 함수
                                    handleExampleQuestionClick={handleExampleQuestionClick} // 예시 질문 클릭 핸들러
                                    exampleQuestions={exampleQuestions}     // 예시 질문 배열
                                />
                            </div>
                        )}
                    </main>
                </div>

                {/* 페이지 하단에 설명 텍스트를 표시합니다. (다크 모드 지원) */}
                <div className="mt-12 text-center text-gray-600 dark:text-gray-400">
                    <p>이 페이지에서 이력서를 업로드하거나 직접 입력하고 AI 분석 결과를 받아볼 수 있으며, 분석 결과에 대해 AI와 대화할 수 있습니다.</p>
                </div>
            </div>
        </div>
    );
}

export default ResumeAnalysisPage;