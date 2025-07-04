// src/pages/ChatbotPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Redux Toolkit을 사용하는 경우, authSlice에서 유저 정보 등을 가져올 수 있습니다.
// import { selectUser } from '../features/auth/authSlice';

// API 호출을 위한 axios (설치 필요: npm install axios)
import axios from 'axios';

function ChatbotPage() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [messages, setMessages] = useState([]); // { type: 'user' | 'ai', text: '...', timestamp: '...' }
    const [currentMessage, setCurrentMessage] = useState('');
    const [isThinking, setIsThinking] = useState(false); // AI가 응답을 생성 중인지 여부

    // --- Gradio "고급 설정"에 해당하는 상태 변수 ---
    const [chunkSize, setChunkSize] = useState(1000); // 청크 크기
    const [chunkOverlap, setChunkOverlap] = useState(200); // 청크 중복
    const [temperature, setTemperature] = useState(0.0); // 창의성 수준 (슬라이더)
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false); // 고급 설정 아코디언 상태
    // ---

    // --- AI 추천/면접 결과 상태 변수 (기존 유지) ---
    const [recommendedResults, setRecommendedResults] = useState(null); // AI 추천 직무/기술 결과
    const [interviewPrepResults, setInterviewPrepResults] = useState(null); // AI 생성 면접 질문 결과
    // ---

    // 채팅 메시지 영역의 스크롤을 관리하기 위한 Ref
    const messagesEndRef = useRef(null);

    // You can get user information from Redux state (example)
    // const user = useSelector(selectUser);
    const userId = 1; // Temporary user ID, should be fetched from Redux/auth state in real app

    // Auto-scroll to the bottom when new messages are added
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // File selection handler
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Check allowed file types
            const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
            if (allowedTypes.includes(file.type)) {
                setSelectedFile(file);
            } else {
                alert('PDF, Word (.docx), TXT 파일만 업로드할 수 있습니다.');
                setSelectedFile(null);
            }
        }
    };

    // Handler to clear the selected file
    const handleClearFile = () => {
        setSelectedFile(null);
        // Optionally, reset the file input element's value to clear its display
        const fileInput = document.getElementById('resumeFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        alert('선택된 파일이 초기화되었습니다.');
    };

    // Resume file upload handler
    const handleFileUpload = async () => {
        if (!selectedFile) {
            alert('업로드할 파일을 선택해주세요.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('userId', userId); 
        // TODO: 청크 크기, 청크 중복 등 고급 설정 값도 함께 보낼 수 있습니다.
        formData.append('chunkSize', chunkSize);
        formData.append('chunkOverlap', chunkOverlap);

        try {
            // TODO: Change to actual backend resume upload API endpoint
            const response = await axios.post('/api/resume/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    // 'Authorization': `Bearer ${user.token}` // Add if authentication token is needed
                },
            });

            if (response.status === 200) {
                alert('이력서가 성공적으로 업로드되었습니다!');
                setSelectedFile(null); // Clear selected file after upload
                handleClearFile(); // Also clear the file input display
            } else {
                alert('이력서 업로드 실패: ' + (response.data.message || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('이력서 업로드 중 오류 발생:', error);
            alert('이력서 업로드 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsUploading(false);
        }
    };

    // 챗봇 메시지 전송 핸들러
    const handleSendMessage = async (e) => {
        e.preventDefault(); // Prevent form default submission
        if (currentMessage.trim() === '') return;

        const userMessage = { type: 'user', text: currentMessage, timestamp: new Date().toLocaleTimeString() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setCurrentMessage(''); // Clear input field
        setIsThinking(true); // Set AI response pending state

        // Clear previous recommendation/interview results (expecting new results for new query)
        setRecommendedResults(null);
        setInterviewPrepResults(null);

        try {
            // TODO: Change to actual backend AI chatbot API endpoint
            // Backend response can include structured data (recommended jobs/skills, interview questions) in addition to general chatbot text.
            // Example response structure: { aiResponse: "...", recommendedJobs: [...], recommendedSkills: [...], interviewQuestions: [...] }
            const response = await axios.post('/api/chat/ask', {
                userId: userId,
                userMessage: currentMessage,
                // selectedResumeId: selectedFile ? selectedFile.id : null, // If resume ID needs to be sent
                // chatHistory: messages.map(msg => ({ type: msg.type, text: msg.text })), // Previous chat history
                temperature: temperature, // AI 창의성 수준 전달
            }, {
                // headers: { 'Authorization': `Bearer ${user.token}` } // Add if authentication token is needed
            });

            if (response.status === 200 && response.data) {
                // Handle general chatbot response
                if (response.data.aiResponse) {
                    const aiResponse = { type: 'ai', text: response.data.aiResponse, timestamp: new Date().toLocaleTimeString() };
                    setMessages((prevMessages) => [...prevMessages, aiResponse]);
                }

                // Handle AI recommended job/skill results
                if (response.data.recommendedJobs || response.data.recommendedSkills) {
                    setRecommendedResults({
                        jobs: response.data.recommendedJobs || [],
                        skills: response.data.recommendedSkills || [],
                    });
                }

                // Handle AI generated interview questions
                if (response.data.interviewQuestions) {
                    setInterviewPrepResults({
                        questions: response.data.interviewQuestions,
                        guidance: response.data.answerGuidance || "각 질문에 대한 답변 방향성을 고려해보세요.", // Overall guidance
                    });
                }

            } else {
                setMessages((prevMessages) => [...prevMessages, { type: 'ai', text: '죄송합니다. 답변을 생성하는 데 실패했습니다.', timestamp: new Date().toLocaleTimeString() }]);
            }
        } catch (error) {
            console.error('AI Chatbot response error:', error);
            setMessages((prevMessages) => [...prevMessages, { type: 'ai', text: '네트워크 오류 또는 AI 서비스 문제. 다시 시도해주세요.', timestamp: new Date().toLocaleTimeString() }]);
        } finally {
            setIsThinking(false);
        }
    };

    // 채팅 기록 초기화 핸들러
    const handleClearChat = () => {
        setMessages([]);
        setRecommendedResults(null);
        setInterviewPrepResults(null);
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
            {/* Header 우선 주석처리*/}
            {/* <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4 shadow-lg flex justify-between items-center rounded-b-xl">
                <h1 className="text-2xl font-extrabold tracking-wide">내일을 위한 가이드: AI 커리어 챗봇</h1>
            </header> */}

            <div className="flex flex-1 overflow-hidden p-6">
                {/* Left Column: PDF Upload & Advanced Settings */}
                <aside className="w-1/3 bg-white p-8 rounded-2xl shadow-xl border border-blue-100 flex flex-col justify-start space-y-6 overflow-y-auto mr-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">이력서 업로드</h2>
                    <input
                        type="file"
                        id="resumeFileInput"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-600
                                  file:mr-4 file:py-3 file:px-6
                                  file:rounded-full file:border-0
                                  file:text-base file:font-semibold
                                  file:bg-blue-100 file:text-blue-700
                                  hover:file:bg-blue-200 transition-colors duration-200 cursor-pointer"
                    />
                    {selectedFile && (
                        <p className="text-gray-700 mt-2 text-center text-base">
                            선택된 파일: <span className="font-semibold text-blue-700">{selectedFile.name}</span>
                        </p>
                    )}
                    <div className="flex space-x-3 w-full">
                        <button
                            onClick={handleFileUpload}
                            disabled={!selectedFile || isUploading}
                            className={`flex-1 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-md
                                        ${!selectedFile || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {isUploading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    업로드 중...
                                </span>
                            ) : '이력서 업로드'}
                        </button>
                        {selectedFile && (
                            <button
                                onClick={handleClearFile}
                                className="flex-none px-4 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-all duration-300 transform hover:scale-105 shadow-md"
                            >
                                파일 초기화
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2 text-center">
                        지원 형식: PDF, Word (.docx), TXT
                    </p>

                    {/* 고급 설정 (Accordion) */}
                    <div className="w-full mt-6">
                        <button
                            onClick={toggleAdvancedSettings}
                            className="w-full text-left p-4 bg-blue-100 rounded-lg font-semibold text-blue-800 hover:bg-blue-200 transition-colors duration-200 flex justify-between items-center shadow-sm"
                        >
                            <span>고급 설정</span>
                            <span>{showAdvancedSettings ? '▲' : '▼'}</span>
                        </button>
                        {showAdvancedSettings && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-b-lg space-y-4 shadow-inner">
                                <div>
                                    <label htmlFor="chunkSize" className="block text-sm font-medium text-blue-700 mb-1">
                                        청크 크기: {chunkSize}
                                    </label>
                                    <input
                                        type="range"
                                        id="chunkSize"
                                        min="100"
                                        max="2000"
                                        step="50"
                                        value={chunkSize}
                                        onChange={(e) => setChunkSize(Number(e.target.value))}
                                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer range-lg accent-blue-600"
                                        title="텍스트를 나누는 단위 (500-2000 권장)"
                                    />
                                    <p className="text-xs text-blue-600 mt-1">텍스트를 나누는 단위 (500-2000 권장)</p>
                                </div>
                                <div>
                                    <label htmlFor="chunkOverlap" className="block text-sm font-medium text-blue-700 mb-1">
                                        청크 중복: {chunkOverlap}
                                    </label>
                                    <input
                                        type="range"
                                        id="chunkOverlap"
                                        min="0"
                                        max="500"
                                        step="10"
                                        value={chunkOverlap}
                                        onChange={(e) => setChunkOverlap(Number(e.target.value))}
                                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer range-lg accent-blue-600"
                                        title="청크 간 중복되는 문자 수 (50-300 권장)"
                                    />
                                    <p className="text-xs text-blue-600 mt-1">청크 간 중복되는 문자 수 (50-300 권장)</p>
                                </div>
                                <div>
                                    <label htmlFor="temperature" className="block text-sm font-medium text-blue-700 mb-1">
                                        창의성 수준: {temperature.toFixed(1)}
                                    </label>
                                    <input
                                        type="range"
                                        id="temperature"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={temperature}
                                        onChange={(e) => setTemperature(Number(e.target.value))}
                                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer range-lg accent-blue-600"
                                        title="0: 정확성 우선, 1: 창의성 우선"
                                    />
                                    <p className="text-xs text-blue-600 mt-1">0: 정확성 우선, 1: 창의성 우선</p>
                                </div>
                            </div>
                        )}
                    </div>


                    {/* AI Recommendation Results Section */}
                    {recommendedResults && (
                        <div className="mt-8 p-6 bg-blue-50 rounded-xl shadow-lg border border-blue-200 w-full">
                            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                                <span className="mr-2 text-2xl">✨</span> AI 추천 결과
                            </h3>
                            {recommendedResults.jobs.length > 0 && (
                                <div className="mb-4">
                                    <h4 className="font-semibold text-blue-700 mb-2">추천 직무:</h4>
                                    <ul className="list-disc list-inside text-gray-800 space-y-1">
                                        {recommendedResults.jobs.map((job, idx) => (
                                            <li key={idx} className="text-sm">{job}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {recommendedResults.skills.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-blue-700 mb-2">필요 기술 스택:</h4>
                                    <ul className="list-disc list-inside text-gray-800 space-y-1">
                                        {recommendedResults.skills.map((skill, idx) => (
                                            <li key={idx} className="text-sm">{skill}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {recommendedResults.jobs.length === 0 && recommendedResults.skills.length === 0 && (
                                <p className="text-gray-600 text-sm">추천 결과가 없습니다.</p>
                            )}
                        </div>
                    )}

                    {/* AI Generated Interview Questions Section */}
                    {interviewPrepResults && (
                        <div className="mt-8 p-6 bg-blue-50 rounded-xl shadow-lg border border-blue-200 w-full"> {/* Changed from purple to blue */}
                            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center"> {/* Changed from purple to blue */}
                                <span className="mr-2 text-2xl">🗣️</span> 예상 면접 질문
                            </h3>
                            {interviewPrepResults.questions.length > 0 ? (
                                <ol className="list-decimal list-inside text-gray-800 space-y-3">
                                    {interviewPrepResults.questions.map((q, idx) => (
                                        <li key={idx}>
                                            <p className="font-semibold text-base">{q.question}</p>
                                            {q.guidance && <p className="text-sm text-gray-700 ml-4 mt-1">💡 {q.guidance}</p>}
                                        </li>
                                    ))}
                                </ol>
                            ) : (
                                <p className="text-gray-600 text-sm">생성된 면접 질문이 없습니다.</p>
                            )}
                            {interviewPrepResults.guidance && interviewPrepResults.questions.length > 0 && (
                                <p className="text-sm text-gray-700 mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300"> {/* Changed from purple to blue */}
                                    **전반적인 답변 가이드라인:** {interviewPrepResults.guidance}
                                </p>
                            )}
                        </div>
                    )}
                </aside>

                {/* Right Column: AI Chatbot Section */}
                <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200">
                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                        {messages.length === 0 && (
                            <div className="flex items-center justify-center h-full text-gray-500 text-lg">
                                <p className="p-4 bg-gray-100 rounded-lg shadow-inner">
                                    AI 커리어 챗봇에게 무엇이든 물어보세요!
                                </p>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex mb-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`relative p-4 rounded-xl max-w-xs lg:max-w-md break-words shadow-md
                                                ${msg.type === 'user'
                                                    ? 'bg-blue-600 text-white rounded-br-none' // User bubble
                                                    : 'bg-gray-200 text-gray-800 rounded-bl-none'}`} // AI bubble
                                >
                                    <p className="text-base leading-relaxed">{msg.text}</p>
                                    <span className="block text-right text-xs mt-2 opacity-80">
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isThinking && (
                            <div className="flex justify-start mb-4">
                                <div className="relative p-3 rounded-lg bg-gray-200 text-gray-800 rounded-bl-none shadow-md">
                                    <span className="dot-pulse"></span> {/* Loading animation */}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chatbot Input Field and Control Buttons */}
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                        <div className="flex flex-col space-y-3"> {/* Changed to flex-col for example buttons */}
                            {/* 질문 예시 버튼 섹션 */}
                            <div className="w-full">
                                <p className="text-sm font-semibold text-gray-700 mb-2">질문 예시:</p>
                                <div className="flex flex-wrap gap-2">
                                    {exampleQuestions.map((q, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleExampleQuestionClick(q)}
                                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors duration-200 border border-blue-300" // Changed to blue
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
                                    전송
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClearChat}
                                    className="px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-300 transform hover:scale-105 shadow-md"
                                >
                                    채팅 초기화
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