// src/features/chat/chatSlice.js
import { createSlice } from '@reduxjs/toolkit';

/**
 * @typedef {object} ChatMessage
 * @property {string} id - 메시지의 고유 ID
 * @property {'user' | 'ai'} sender - 메시지 발신자 ('user' 또는 'ai')
 * @property {string} text - 메시지 내용
 */

/**
 * 채팅 슬라이스의 초기 상태를 정의합니다.
 * @typedef {object} ChatState
 * @property {Array<ChatMessage>} messages - 채팅 메시지 목록. 각 메시지는 { id, sender, text } 형태
 * @property {boolean} isAiTyping - AI가 현재 응답을 생성 중인지 여부
 * @property {string | null} error - 채팅 관련 에러 메시지 (없으면 null)
 */
const initialState = {
    messages: [], // 채팅 메시지 목록
    isAiTyping: false, // AI가 응답을 생성 중인지 여부
    error: null, // 채팅 관련 에러 메시지
};

/**
 * `chat` Redux 슬라이스를 생성합니다.
 * 이 슬라이스는 채팅 메시지 관리, AI 타이핑 상태, 에러 처리 등의 로직을 포함합니다.
 */
export const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        /**
         * 사용자 메시지를 메시지 목록에 추가합니다.
         * @param {ChatState} state - 현재 상태
         * @param {string} action.payload - 사용자 메시지 텍스트
         */
        addUserMessage: (state, action) => {
            state.messages.push({
                id: Date.now() + '-user', // 고유 ID 생성 (간단한 예시)
                sender: 'user',
                text: action.payload, // payload는 사용자 메시지 텍스트
            });
            state.error = null; // 새 메시지 시작 시 에러 초기화
            state.isAiTyping = true; // 사용자 메시지 후 AI가 타이핑 시작
        },
        /**
         * AI 메시지를 메시지 목록에 추가합니다.
         * @param {ChatState} state - 현재 상태
         * @param {string} action.payload - AI 응답 텍스트
         */
        addAiMessage: (state, action) => {
            state.messages.push({
                id: Date.now() + '-ai', // 고유 ID 생성
                sender: 'ai',
                text: action.payload, // payload는 AI 응답 텍스트
            });
            state.isAiTyping = false; // AI 응답 완료 후 타이핑 종료
        },
        /**
         * AI 타이핑 상태를 설정합니다.
         * @param {ChatState} state - 현재 상태
         * @param {boolean} action.payload - AI 타이핑 상태 (true 또는 false)
         */
        setAiTyping: (state, action) => {
            state.isAiTyping = action.payload; // true 또는 false
        },
        /**
         * 채팅 에러 메시지를 설정합니다.
         * 에러 발생 시 AI 타이핑 상태를 종료합니다.
         * @param {ChatState} state - 현재 상태
         * @param {string} action.payload - 에러 메시지 텍스트
         */
        setChatError: (state, action) => {
            state.error = action.payload;
            state.isAiTyping = false;
        },
        /**
         * 채팅 메시지 목록, AI 타이핑 상태, 에러 상태를 모두 초기화합니다.
         * 새로운 대화를 시작할 때 사용될 수 있습니다.
         * @param {ChatState} state - 현재 상태
         */
        clearChat: (state) => {
            state.messages = [];
            state.isAiTyping = false;
            state.error = null;
        },
        /**
         * 특정 질문에 대한 대화를 시작하도록 초기 메시지 상태를 설정합니다.
         * 기존 메시지를 모두 지우고 AI로부터의 첫 질문 메시지를 설정합니다.
         * @param {ChatState} state - 현재 상태
         * @param {string} action.payload - 시작할 질문 텍스트
         */
        startQuestionChat: (state, action) => {
            state.messages = [
                { id: 'initial-q', sender: 'ai', text: `면접 질문: "${action.payload}"\n\n이 질문에 대한 답변을 입력해주세요. AI가 피드백을 드릴 수 있습니다.` }
            ];
            state.isAiTyping = false; // 질문 시작 시 AI는 바로 타이핑하지 않음
            state.error = null;
        },
        /**
         * 대화 기록 전체를 한 번에 새로운 메시지 배열로 설정합니다.
         * 예를 들어, 저장된 대화 기록을 불러올 때 사용됩니다.
         *
         * @param {ChatState} state - 현재 상태
         * @param {Array<ChatMessage> | object} action.payload - 새로운 메시지 배열.
         * **주의:** 백엔드 응답이 `object` 타입으로 올 경우 React 오류를 방지하기 위해
         * 이 리듀서에서 payload가 배열인지 검사하고, 아니면 빈 배열로 처리합니다.
         */
        setMessages: (state, action) => {
            // **테스트 및 안전 장치 추가**: `action.payload`가 유효한 배열인지 확인
            // 백엔드에서 대화 기록이 없거나 잘못된 형식으로 응답할 경우를 대비합니다.
            if (!Array.isArray(action.payload)) {
                console.warn(
                    "setMessages 액션: payload가 배열이 아닙니다. 받은 payload:",
                    action.payload,
                    "메시지 목록을 빈 배열로 초기화합니다. (React 렌더링 오류 방지)"
                );
                state.messages = []; // 배열이 아니면 빈 배열로 설정하여 컴포넌트 렌더링 오류 방지
            } else {
                state.messages = action.payload; // payload가 유효한 배열이면 그대로 상태에 설정
            }

            state.isAiTyping = false; // 메시지 설정 후 AI는 타이핑 중이 아님
            state.error = null;        // 에러 상태 초기화
        }
    },
});

// 생성된 모든 액션 크리에이터를 export 합니다.
export const {
    addUserMessage,
    addAiMessage,
    setAiTyping,
    setChatError,
    clearChat,
    startQuestionChat,
    // 새로 추가된 setMessages 액션을 export 목록에 추가합니다.
    setMessages
} = chatSlice.actions;

// 리듀서를 기본 export 합니다.
export default chatSlice.reducer;