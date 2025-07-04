// src/pages/ChatbotPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { selectUser } from '../features/auth/authSlice';

import axios from 'axios';

// 새로 생성한 컴포넌트 임포트
import ResumeUploadSection from '../components/ResumeUploadSection';
import ChatInterface from '../components/ChatInterface';

function ChatbotPage() {
    // --- 상태 변수 (ChatbotPage에서 관리) ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [messages, setMessages] = useState([]); // { type: 'user' | 'ai', text: '...', timestamp: '...' }
    const [currentMessage, setCurrentMessage] = useState('');
    const [isThinking, setIsThinking] = useState(false); // AI가 응답을 생성 중인지 여부

    const [chunkSize, setChunkSize] = useState(1000); // 청크 크기
    const [chunkOverlap, setChunkOverlap] = useState(200); // 청크 중복
    const [temperature, setTemperature] = useState(0.0); // 창의성 수준 (슬라이더)
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false); // 고급 설정 아코디언 상태

    // AI 추천/면접 결과 상태 변수
    const [recommendedResults, setRecommendedResults] = useState(null); // AI 추천 직무/기술 결과
    const [interviewPrepResults, setInterviewPrepResults] = useState(null); // AI 생성 면접 질문 결과
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

    // --- 파일 업로드 관련 핸들러 (ResumeUploadSection으로 전달) ---
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

    const handleFileUpload = async () => {
        if (!selectedFile) {
            alert('업로드할 파일을 선택해주세요.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('userId', userId); 
        formData.append('chunkSize', chunkSize);
        formData.append('chunkOverlap', chunkOverlap);

        try {
            // TODO: 실제 백엔드 이력서 업로드 API 엔드포인트로 변경
            const response = await axios.post('/api/resume/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    // 'Authorization': `Bearer ${user.token}`
                },
            });

            if (response.status === 200) {
                alert('이력서가 성공적으로 업로드되었습니다!');
                setSelectedFile(null);
                handleClearFile();
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
    // ---

    // --- 챗봇 메시지 전송 관련 핸들러 (ChatInput으로 전달) ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (currentMessage.trim() === '') return;

        const userMessage = { type: 'user', text: currentMessage, timestamp: new Date().toLocaleTimeString() };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setCurrentMessage('');
        setIsThinking(true);

        setRecommendedResults(null);
        setInterviewPrepResults(null);

        try {
            // TODO: 실제 백엔드 AI 챗봇 API 엔드포인트로 변경
            const response = await axios.post('/api/chat/ask', {
                userId: userId,
                userMessage: currentMessage,
                temperature: temperature,
                // selectedResumeId: selectedFile ? selectedFile.id : null, 
                // chatHistory: messages.map(msg => ({ type: msg.type, text: msg.text })),
            }, {
                // headers: { 'Authorization': `Bearer ${user.token}` }
            });

            if (response.status === 200 && response.data) {
                if (response.data.aiResponse) {
                    const aiResponse = { type: 'ai', text: response.data.aiResponse, timestamp: new Date().toLocaleTimeString() };
                    setMessages((prevMessages) => [...prevMessages, aiResponse]);
                }
                if (response.data.recommendedJobs || response.data.recommendedSkills) {
                    setRecommendedResults({
                        jobs: response.data.recommendedJobs || [],
                        skills: response.data.recommendedSkills || [],
                    });
                }
                if (response.data.interviewQuestions) {
                    setInterviewPrepResults({
                        questions: response.data.interviewQuestions,
                        guidance: response.data.answerGuidance || "각 질문에 대한 답변 방향성을 고려해보세요.",
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

    const handleClearChat = () => {
        setMessages([]);
        setRecommendedResults(null);
        setInterviewPrepResults(null);
        alert('채팅 기록이 초기화되었습니다.');
    };

    const handleExampleQuestionClick = (question) => {
        setCurrentMessage(question);
    };
    // ---

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
            {/* Header 주석 처리*/}
            {/* <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4 shadow-lg flex justify-between items-center rounded-b-xl">
                <h1 className="text-2xl font-extrabold tracking-wide">내일을 위한 가이드: AI 커리어 챗봇</h1>
            </header> */}

            <div className="flex flex-1 overflow-hidden p-6">
                {/* Left Column: Resume Upload & Advanced Settings & AI Results */}
                <ResumeUploadSection
                    selectedFile={selectedFile}
                    isUploading={isUploading}
                    handleFileChange={handleFileChange}
                    handleClearFile={handleClearFile}
                    handleFileUpload={handleFileUpload}
                    chunkSize={chunkSize}
                    N
                    setChunkSize={setChunkSize}
                    chunkOverlap={chunkOverlap}
                    setChunkOverlap={setChunkOverlap}
                    temperature={temperature}
                    setTemperature={setTemperature}
                    showAdvancedSettings={showAdvancedSettings}
                    toggleAdvancedSettings={toggleAdvancedSettings}
                    recommendedResults={recommendedResults}
                    interviewPrepResults={interviewPrepResults}
                />

                {/* Right Column: AI Chatbot Section */}
                <ChatInterface
                    messages={messages}
                    isThinking={isThinking}
                    messagesEndRef={messagesEndRef}
                    currentMessage={currentMessage}
                    setCurrentMessage={setCurrentMessage}
                    handleSendMessage={handleSendMessage}
                    handleClearChat={handleClearChat}
                    handleExampleQuestionClick={handleExampleQuestionClick}
                    exampleQuestions={exampleQuestions}
                />
            </div>
        </div>
    );
}

export default ChatbotPage;
