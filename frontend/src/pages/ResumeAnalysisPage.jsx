import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

import ResumeUploadSection from '../components/ResumeUploadSection';
import AnalysisResultDisplay from '../components/AnalysisResultDisplay';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

import { startAnalysis, analysisSuccess, analysisFailure, clearAnalysis } from '../features/analysis/analysisSlice';
import { addUserMessage, addAiMessage, clearChat } from '../features/chat/chatSlice';
import { notifyError, notifySuccess } from '../components/Notification';

function ResumeAnalysisPage() {
    const dispatch = useDispatch();

    const { results: analysisResults, isLoading: isAnalysisLoading, error: analysisError } = useSelector((state) => state.analysis);
    const { messages: chatMessages, isAiTyping } = useSelector((state) => state.chat);

    const [isAnalysisChatMode, setIsAnalysisChatMode] = useState(false);
    const [chatSettings, setChatSettings] = useState({ temperature: 0.5 });
    
    useEffect(() => {
        return () => {
            dispatch(clearAnalysis());
            dispatch(clearChat());
        };
    }, [dispatch]);

    const analyzeResume = async ({ file, settings }) => {
        if (!file || !settings) {
            notifyError("분석할 파일 또는 설정값이 없습니다.");
            return;
        }
        if (isAnalysisLoading) return;

        dispatch(startAnalysis());
        setIsAnalysisChatMode(false);
        setChatSettings(settings);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('chunkSize', settings.chunkSize);
        formData.append('chunkOverlap', settings.chunkOverlap);

        try {
            const response = await axiosInstance.post('/resume/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            notifySuccess(response.data.message || "파일이 성공적으로 업로드 및 처리되었습니다.");
            
            const mockResults = {
                summary: "AI가 현재 이력서를 분석 중입니다. 잠시 후 아래 채팅창에서 분석 결과에 대해 질문해보세요.",
                skills: [],
                recommendations: "채팅을 통해 이력서에 대한 심층 분석을 요청할 수 있습니다.",
                recommendedSkills: []
            };
            dispatch(analysisSuccess(mockResults));
            setIsAnalysisChatMode(true);
            
            dispatch(addAiMessage({ text: `이력서(${file.name}) 분석 준비가 완료되었습니다! 이 내용을 바탕으로 궁금한 점을 질문해보세요.` }));

        } catch (error) {
            dispatch(analysisFailure("이력서 파일 처리 중 오류가 발생했습니다."));
            console.error("Resume upload error:", error);
        }
    };

    const handleClearAll = () => {
        dispatch(clearAnalysis());
        dispatch(clearChat());
        setIsAnalysisChatMode(false);
    };

    const handleReEnterAnalysisChat = () => setIsAnalysisChatMode(true);
    const handleExitAnalysisChatMode = () => setIsAnalysisChatMode(false);

    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || isAiTyping) return;

        // [수정] messages -> chatMessages 변수명 오류 수정
        const conversationId = chatMessages.find(m => m.conversationId)?.conversationId || null;
        dispatch(addUserMessage({ text: messageText, conversationId }));

        try {
            const response = await axiosInstance.post('/chat/send', {
                message: messageText,
                conversationId: conversationId,
                temperature: chatSettings.temperature,
            });
            
            const aiResponse = response.data;
            dispatch(addAiMessage({ text: aiResponse.message, conversationId: aiResponse.conversationId }));

        } catch (err) {
            console.error("Chat send error:", err);
            const errorMessage = err.response?.data?.message || "답변을 가져오는 중 오류가 발생했습니다.";
            dispatch(addAiMessage({ text: `오류: ${errorMessage}` }));
        }
    };

    const exampleQuestions = [
        "이력서 요약 내용을 다시 알려줘.",
        "내 강점들을 활용할 수 있는 직무가 있을까?",
        "이력서를 바탕으로 예상 면접 질문을 해줘."
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-inter">
            {/* ... JSX 생략 ... */}
        </div>
    );
}

export default ResumeAnalysisPage;
