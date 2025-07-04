// src/pages/ChatbotPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { selectUser } from '../features/auth/authSlice';

// API 호출을 위한 axios (데모에서는 직접 사용하지 않지만, 구조 유지를 위해 임포트)
import axios from 'axios';
import { Send, Trash2 } from 'lucide-react'; // 아이콘 임포트

// 새로 생성한 컴포넌트 임포트
import ResumeUploadSection from '../components/ResumeUploadSection';
import ChatInterface from '../components/ChatInterface';
import ChatWindow from '../components/ChatWindow'; // ChatInterface 내부에서 사용되지만, 명시적 임포트
import ChatInput from '../components/ChatInput'; // ChatInterface 내부에서 사용되지만, 명시적 임포트


function ChatbotPage() {
    // --- 상태 변수 (ChatbotPage에서 관리) ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [messages, setMessages] = useState([]); // { type: 'user' | 'ai', text: '...', timestamp: '...' }
    const [currentMessage, setCurrentMessage] = useState('');
    const [isThinking, setIsThinking] = useState(false); // AI가 응답을 생성 중인지 여부

    // Gradio "고급 설정"에 해당하는 상태 변수
    const [chunkSize, setChunkSize] = useState(1000); // 청크 크기
    const [chunkOverlap, setChunkOverlap] = useState(200); // 청크 중복
    const [temperature, setTemperature] = useState(0.0); // 창의성 수준 (슬라이더)
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false); // 고급 설정 아코디언 상태

    // AI 추천/면접 결과 상태 변수는 이제 UI 렌더링에 직접 사용되지 않고,
    // 메시지 생성 시 내부적으로만 사용됩니다. (그래도 필요하다면 유지)
    const [recommendedResults, setRecommendedResults] = useState(null); 
    const [interviewPrepResults, setInterviewPrepResults] = useState(null); 
    // ---

    // 채팅 메시지 영역의 스크롤을 관리하기 위한 Ref
    const messagesEndRef = useRef(null);

    // You can get user information from Redux state (example)
    // const user = useSelector(selectUser);
    const userId = 1; // Temporary user ID, should be fetched from Redux/auth state in real app

    // 새 메시지가 추가될 때마다 자동으로 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 파일 선택 핸들러
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
            if (allowedTypes.includes(file.type)) {
                setSelectedFile(file);
            } else {
                alert('PDF, Word (.docx), TXT 파일만 업로드할 수 있습니다.');
                setSelectedFile(null);
            }
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        const fileInput = document.getElementById('resumeFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        alert('선택된 파일이 초기화되었습니다.');
    };

    // --- 데모 이력서 파일 업로드 핸들러 ---
    const handleFileUpload = async () => {
        if (!selectedFile) {
            alert('업로드할 파일을 선택해주세요.');
            return;
        }

        setIsUploading(true);
        // 실제 백엔드 API 호출 대신 setTimeout으로 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 지연 시뮬레이션

        try {
            // 데모: 항상 성공으로 가정
            alert(`이력서 "${selectedFile.name}"가 성공적으로 업로드되었습니다! (데모)`);
            
            // 업로드 성공 후, AI에게 이력서 분석을 요청하는 메시지를 자동 생성하여 채팅창에 표시
            setMessages((prev) => [...prev, { 
                type: 'ai', 
                text: `이력서 "${selectedFile.name}" 분석을 시작합니다. 궁금한 점을 질문해주세요!`, 
                timestamp: new Date().toLocaleTimeString() 
            }]);
            
            setSelectedFile(null); // Clear selected file after upload
            handleClearFile(); // Also clear the file input display
        } catch (error) {
            // 데모에서는 이 catch 블록에 도달하지 않음
            console.error('이력서 업로드 중 오류 발생 (데모):', error);
            setMessages((prev) => [...prev, { 
                type: 'ai', 
                text: `이력서 업로드 중 오류가 발생했습니다. 다시 시도해주세요. (데모 오류)`, 
                timestamp: new Date().toLocaleTimeString() 
            }]);
        } finally {
            setIsUploading(false);
        }
    };
    // ---

    // --- 데모 챗봇 메시지 전송 핸들러 ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (currentMessage.trim() === '') return;

        const userMessage = { type: 'user', text: currentMessage, timestamp: new Date().toLocaleTimeString() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setCurrentMessage('');
        setIsThinking(true);

        // 실제 백엔드 API 호출 대신 setTimeout으로 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 지연 시뮬레이션

        try {
            let aiResponseContent = ""; // AI 응답 콘텐츠 (텍스트 + 구조화된 정보)

            // 간단한 키워드 기반 응답 시뮬레이션
            const lowerCaseMessage = currentMessage.toLowerCase();

            if (lowerCaseMessage.includes("이력서 분석") || lowerCaseMessage.includes("추천 직무")) {
                const jobs = ["백엔드 개발자 (Java)", "클라우드 아키텍트", "DevOps 엔지니어"];
                const skills = ["Spring Boot", "AWS", "Docker", "Kubernetes", "CI/CD"];
                
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
                const guidance = "각 질문에 대해 구체적인 경험과 사례를 들어 답변을 준비하세요. 회사의 인재상과 핵심 가치를 파악하는 것이 중요합니다.";

                aiResponseContent = "요청하신 면접 유형에 맞춰 예상 질문을 생성했습니다:\n\n";
                questions.forEach((q, idx) => {
                    aiResponseContent += `${idx + 1}. **${q.question}**\n`;
                    if (q.guidance) {
                        aiResponseContent += `   💡 *${q.guidance}*\n`;
                    }
                });
                aiResponseContent += `\n**🗣️ 전반적인 답변 가이드라인:** ${guidance}\n`;
                aiResponseContent += "\n이 질문들에 대해 답변 연습을 도와드릴까요?";

            } else if (lowerCaseMessage.includes("데이터 분석가") || lowerCaseMessage.includes("데이터 분석가가 되려면")) {
                // 데이터 분석가 관련 구체적인 데모 응답 추가
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
                aiResponseContent = `"${currentMessage}"에 대해 답변을 준비 중입니다. 잠시만 기다려 주세요. (데모 응답)\n\n더 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.`;
            }

            // 무작위로 오류 시뮬레이션 (10% 확률)
            if (Math.random() < 0.1) {
                throw new Error("데모 AI 서비스 오류가 발생했습니다.");
            }

            const aiResponse = { type: 'ai', text: aiResponseContent, timestamp: new Date().toLocaleTimeString() };
            setMessages((prevMessages) => [...prevMessages, aiResponse]);

        } catch (error) {
            console.error('AI 챗봇 응답 오류 (데모):', error);
            setMessages((prevMessages) => [...prevMessages, { type: 'ai', text: `죄송합니다. 데모 AI 서비스 오류가 발생했습니다: ${error.message}. 다시 시도해주세요.`, timestamp: new Date().toLocaleTimeString() }]);
        } finally {
            setIsThinking(false);
        }
    };
    // ---

    // 채팅 기록 초기화 핸들러
    const handleClearChat = () => {
        setMessages([]);
        setRecommendedResults(null); // 내부적으로도 초기화
        setInterviewPrepResults(null); // 내부적으로도 초기화
        alert('채팅 기록이 초기화되었습니다.');
    };

    // 예시 질문 버튼 클릭 핸들러
    const handleExampleQuestionClick = (question) => {
        setCurrentMessage(question); // 입력창에 예시 질문 채우기
    };

    // Gradio의 "고급 설정" 아코디언 토글
    const toggleAdvancedSettings = () => {
        setShowAdvancedSettings(!showAdvancedSettings);
    };

    const exampleQuestions = [
        "내 이력서를 분석하고 추천 직무를 알려줘.",
        "프론트엔드 개발자 면접 예상 질문을 알려줘.",
        "데이터 분석가가 되려면 어떤 기술이 필요해?"
    ];

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-inter">
            {/* Header 디자인에 따라 결정할거라 주석처리 */}
            {/* <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4 shadow-lg flex justify-between items-center rounded-b-xl">
                <h1 className="text-2xl font-extrabold tracking-wide">내일을 위한 가이드: AI 커리어 챗봇</h1>
            </header> */}

            <div className="flex flex-1 overflow-hidden p-6">
                {/* Left Column: PDF Upload & Advanced Settings */}
                <ResumeUploadSection
                    selectedFile={selectedFile}
                    isUploading={isUploading}
                    handleFileChange={handleFileChange}
                    handleClearFile={handleClearFile}
                    handleFileUpload={handleFileUpload}
                    chunkSize={chunkSize}
                    setChunkSize={setChunkSize}
                    chunkOverlap={chunkOverlap}
                    setChunkOverlap={setChunkOverlap}
                    temperature={temperature}
                    setTemperature={setTemperature}
                    showAdvancedSettings={showAdvancedSettings}
                    toggleAdvancedSettings={toggleAdvancedSettings}
                />

                {/* Right Column: AI Chatbot Section */}
                <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200">
                    <ChatWindow
                        messages={messages}
                        isThinking={isThinking}
                        messagesEndRef={messagesEndRef}
                    />

                    {/* Chatbot Input Field and Control Buttons */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                        <div className="flex flex-col space-y-3">
                            {/* 질문 예시 버튼 섹션 */}
                            <div className="w-full">
                                <p className="text-sm font-semibold text-gray-700 mb-2">질문 예시:</p>
                                <div className="flex flex-wrap gap-2">
                                    {exampleQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleExampleQuestionClick(q)}
                                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors duration-200 border border-blue-300"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <input
                                    type="text"
                                    value={currentMessage}
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    placeholder="AI 챗봇에게 질문하세요..."
                                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    disabled={isThinking}
                                />
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 shadow-md"
                                    disabled={isThinking}
                                >
                                    <span className="flex items-center justify-center">
                                        <Send size={18} className="mr-2" /> 전송
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearChat}
                                    className="px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 transform hover:scale-105 shadow-md"
                                >
                                    <span className="flex items-center justify-center">
                                        <Trash2 size={18} className="mr-1" /> 채팅 초기화
                                    </span>
                                </button>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
}

export default ChatbotPage;
