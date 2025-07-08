// src/pages/ChatbotPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// 컴포넌트 임포트
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';

// Redux 액션 임포트
import { addUserMessage, addAiMessage, clearChat, startQuestionChat, setMessages, setChatError } from '../features/chat/chatSlice';

// 알림 컴포넌트 임포트
import { notifyError } from '../components/Notification';

// API 호출을 위한 axiosInstance 임포트 (Authorization 헤더 자동 추가)
import axiosInstance from '../utils/axiosInstance';
// *** 중요: axios.isAxiosError를 사용하기 위해 axios 자체도 임포트합니다. ***
import axios from 'axios'; 

/**
 * 특정 대화 기록을 표시하고 사용자와 AI 간의 대화를 관리하는 페이지 컴포넌트입니다.
 * URL 파라미터에서 대화 ID를 받아 백엔드로부터 대화 기록을 불러옵니다.
 */
function ChatbotPage() {
    const dispatch = useDispatch();
    const { id } = useParams(); // URL 파라미터에서 대화 ID (예: conv_resume_1) 가져오기

    // Redux 스토어에서 채팅 관련 상태를 가져옵니다.
    const { messages: chatMessages, isAiTyping, error: chatError } = useSelector((state) => state.chat);
    // console.log("ChatbotPage - useSelector로 가져온 chatMessages (초기/업데이트):", chatMessages); // 디버깅용 로그

    // 메시지 목록의 끝으로 자동 스크롤하기 위한 ref
    const messagesEndRef = useRef(null);

    /**
     * 컴포넌트가 언마운트될 때 Redux 채팅 상태를 초기화합니다.
     * 새로운 대화로 이동하거나 페이지를 벗어날 때 이전 기록을 정리합니다.
     */
    useEffect(() => {
        return () => {
            dispatch(clearChat()); // 채팅 기록 및 관련 상태 초기화
        };
    }, [dispatch]);

    /**
     * URL의 대화 ID(`id`)가 변경될 때마다 해당 대화 기록을 백엔드에서 불러옵니다.
     * 이 함수는 `useEffect` 내부에서 비동기적으로 실행됩니다.
     */
    useEffect(() => {
        if (id) { // 대화 ID가 존재할 경우에만 대화 기록을 불러옵니다.
            const fetchConversation = async () => {
                try {
                    // axiosInstance를 사용하여 백엔드 API 호출: 인증 토큰이 자동으로 포함됩니다.
                    // baseURL이 이미 '/api'로 설정되어 있으므로 경로에서 '/api'를 제거합니다.
                    const response = await axiosInstance.get(`/conversations/${id}`);
                    
                    // Axios는 응답 데이터를 `response.data`에 담아줍니다.
                    const data = response.data;

                    // --- 백엔드 응답 데이터 확인 및 방어 로직 ---
                    console.log("백엔드로부터 받은 원본 데이터 (fetchConversation):", data);

                    let loadedMessages = []; // 기본적으로 빈 배열로 초기화하여 런타임 오류 방지

                    // 백엔드 응답 데이터 구조에 따라 메시지 배열에 접근합니다.
                    // 이 부분이 중요합니다! 백엔드가 어떤 형태로 메시지 배열을 주는지 정확히 확인하세요.
                    // 예시 1: 백엔드가 `{ messages: [...] }` 형태로 보낼 경우 (가장 일반적)
                    if (data && Array.isArray(data.messages)) {
                        loadedMessages = data.messages;
                    }
                    // 예시 2: 백엔드가 `{ conversation: { _id, messages: [...] } }` 형태로 보낼 경우
                    // else if (data && data.conversation && Array.isArray(data.conversation.messages)) {
                    //    loadedMessages = data.conversation.messages;
                    // }
                    // 예시 3: 백엔드가 직접 메시지 배열 `[...]`을 보낼 경우
                    else if (Array.isArray(data)) {
                        loadedMessages = data;
                    }
                    // 그 외의 경우 (예: data가 빈 객체 {}이거나 null 등), loadedMessages는 여전히 빈 배열로 유지됩니다.
                    
                    console.log("setMessages에 전달될 loadedMessages (정제 후):", loadedMessages);

                    // Redux 스토어의 messages 상태를 업데이트합니다.
                    // chatSlice의 setMessages 리듀서에서 이미 배열 여부를 검사하지만, 여기서도 확실히 배열을 전달.
                    dispatch(setMessages(loadedMessages));

                } catch (error) {
                    console.error("대화 기록 로드 중 오류 발생:", error);
                    let errorMessage = '대화 기록을 불러오는 데 실패했습니다. ';
                    
                    // *** 수정: axios.isAxiosError를 사용합니다. ***
                    if (axios.isAxiosError(error) && error.response) { // axiosInstance가 아닌 axios의 isAxiosError 사용
                        if (error.response.status === 401) {
                            errorMessage += error.response.data?.message || '인증이 필요합니다. 다시 로그인해주세요.';
                            // 선택적으로 여기서 로그아웃 액션 디스패치 가능: store.dispatch(logout());
                        } else if (error.response.status === 404) {
                            errorMessage += error.response.data?.message || '해당 대화 기록을 찾을 수 없습니다.';
                        } else if (error.response.status >= 500) {
                            errorMessage += '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
                        } else {
                            errorMessage += error.response.data?.message || `(코드: ${error.response.status})`;
                        }
                    } else if (axios.isAxiosError(error) && error.request) { // axiosInstance가 아닌 axios의 isAxiosError 사용
                        errorMessage += '서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.';
                    } else {
                        errorMessage += error.message || '알 수 없는 오류가 발생했습니다.';
                    }

                    dispatch(setChatError(errorMessage)); // Redux 스토어에 에러 메시지 설정
                    notifyError(errorMessage); // 사용자에게 알림 표시 (axiosInstance 인터셉터와 중복될 수 있음)
                    dispatch(setMessages([])); // 에러 발생 시 메시지 목록을 빈 배열로 초기화하여 렌더링 오류 방지
                }
            };
            fetchConversation();
        } else {
            // ID가 없으면 새 대화를 시작하도록 채팅 상태를 초기화합니다.
            dispatch(clearChat());
        }
    }, [id, dispatch]); // `id`와 `dispatch`가 변경될 때마다 이 `useEffect`가 실행됩니다.

    /**
     * `chatMessages` 상태가 변경될 때마다 채팅창을 최신 메시지 위치로 자동 스크롤합니다.
     */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    /**
     * 사용자 메시지 전송 및 AI 응답 시뮬레이션을 처리합니다.
     * @param {string} messageText - 사용자가 입력한 메시지 텍스트
     */
    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || isAiTyping) return; // 메시지가 비었거나 AI가 타이핑 중이면 전송 방지

        dispatch(addUserMessage(messageText)); // 사용자 메시지를 Redux 스토어에 추가

        // TODO: 실제 AI API 호출 및 응답 처리 로직을 여기에 구현합니다.
        // 이 API도 인증이 필요하다면 axiosInstance를 사용해야 합니다.
        try {
            // 예시: 실제 AI 응답 API 호출 시 axiosInstance 사용
            // const aiResponse = await axiosInstance.post('/chat', { message: messageText, conversationId: id });
            // dispatch(addAiMessage(aiResponse.data.text));
            
            await new Promise(resolve => setTimeout(resolve, 1500)); // API 호출 시뮬레이션 지연
            dispatch(addAiMessage(`"${messageText.substring(0, Math.min(messageText.length, 15))}..."에 대한 데모 AI 답변입니다.`));
        } catch (error) {
            console.error("메시지 전송 중 오류 발생:", error);
            // 메시지 전송 에러도 axiosInstance 인터셉터에서 처리되므로, 여기서 notifyError는 중복될 수 있습니다.
            dispatch(setChatError('메시지 전송 중 오류가 발생했습니다.'));
            notifyError('메시지 전송에 실패했습니다.');
        }
    };

    /**
     * 현재 채팅 기록을 초기화합니다.
     */
    const handleClearChat = () => {
        dispatch(clearChat()); // Redux 스토어의 채팅 기록 초기화
        // TODO: 필요한 경우 백엔드에 대화 초기화 또는 저장 API 호출 (대화 ID가 있을 경우)
    };

    /**
     * 예시 질문 클릭 시 해당 질문 텍스트로 메시지를 즉시 전송합니다.
     * @param {string} question - 클릭된 예시 질문 텍스트
     */
    const handleExampleQuestionClick = (question) => {
        handleSendMessage(question); // ChatInput에서 받은 질문을 직접 전송
    };

    // 채팅 입력 컴포넌트에서 사용할 예시 질문 목록
    const exampleQuestions = [
        "이전 대화 요약해줘.",
        "이 질문은 어떤 의미로 받아들여야 할까?",
        "대화 저장하는 방법 알려줘."
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-inter">
            <div className="container mx-auto p-6 flex flex-col h-screen">
                {/* 페이지 헤더 섹션 */}
                <div className="flex items-center mb-6 flex-shrink-0">
                    {/* 대화 기록 목록 페이지로 돌아가는 링크 */}
                    <Link
                        to="/history"
                        className="p-2 mr-4 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="대화 기록 목록으로 돌아가기"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </Link>
                    {/* 페이지 제목 */}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                        대화 기록 보기
                    </h1>
                </div>

                {/* 메인 채팅 인터페이스 영역 */}
                <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700 h-full">
                    {/* 채팅 메시지 표시 영역 */}
                    <ChatWindow
                        messages={chatMessages}
                        isThinking={isAiTyping}
                        messagesEndRef={messagesEndRef} // ChatWindow 내부에서 자동 스크롤용으로 사용될 ref 전달
                    />

                    {/* 챗봇 입력 필드 및 컨트롤 버튼 */}
                    <ChatInput
                        onSendMessage={handleSendMessage}
                        isLoading={isAiTyping}
                        handleClearChat={handleClearChat}
                        handleExampleQuestionClick={handleExampleQuestionClick}
                        exampleQuestions={exampleQuestions}
                    />
                </main>
            </div>
        </div>
    );
}

export default ChatbotPage;