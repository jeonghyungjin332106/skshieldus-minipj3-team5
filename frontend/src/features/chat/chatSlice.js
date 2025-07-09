import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
    messages: [],
    isAiTyping: false,
    error: null,
};

/**
 * `chat` Redux 슬라이스를 생성합니다.
 * 모든 메시지에 고유 ID를 부여하고, 객체 형태의 payload를 올바르게 처리합니다.
 */
const chatSlice = createSlice({
    name: 'chat',
    initialState,
    reducers: {
        // [수정] payload가 객체({text, conversationId})인 경우를 처리하도록 prepare 함수를 수정합니다.
        addUserMessage: {
            reducer(state, action) {
                state.messages.push(action.payload);
                state.isAiTyping = true;
                state.error = null;
            },
            prepare(payload) { // payload는 이제 {text, conversationId} 객체입니다.
                return {
                    payload: {
                        id: nanoid(),
                        sender: 'user',
                        text: payload.text, // 객체에서 text 속성을 명시적으로 추출합니다.
                        conversationId: payload.conversationId,
                    },
                };
            },
        },
        // [수정] AI 메시지도 동일하게 수정합니다.
        addAiMessage: {
            reducer(state, action) {
                state.messages.push(action.payload);
                state.isAiTyping = false;
            },
            prepare(payload) { // payload는 이제 {text, conversationId} 객체입니다.
                return {
                    payload: {
                        id: nanoid(),
                        sender: 'ai',
                        text: payload.text, // 객체에서 text 속성을 명시적으로 추출합니다.
                        conversationId: payload.conversationId,
                    },
                };
            },
        },
        // 대화 기록 전체를 설정하는 액션
        setMessages: (state, action) => {
            if (Array.isArray(action.payload)) {
                state.messages = action.payload;
            } else {
                console.warn("setMessages 액션: payload가 배열이 아닙니다.", action.payload);
                state.messages = [];
            }
            state.isAiTyping = false;
            state.error = null;
        },
        // 채팅 상태를 초기화하는 액션
        clearChat: (state) => {
            state.messages = [];
            state.isAiTyping = false;
            state.error = null;
        },
        // AI 타이핑 상태를 직접 제어하는 액션
        setAiTyping: (state, action) => {
            state.isAiTyping = action.payload;
        },
        // 특정 질문으로 대화를 시작하는 액션
        startQuestionChat: (state, action) => {
            state.messages = [
                { id: 'initial-q', sender: 'ai', text: `면접 질문: "${action.payload}"\n\n이 질문에 대한 답변을 입력해주세요.` }
            ];
            state.isAiTyping = false;
            state.error = null;
       },
    },
});

export const {
    addUserMessage,
    addAiMessage,
    setMessages,
    clearChat,
    setAiTyping,
    startQuestionChat,
} = chatSlice.actions;

export default chatSlice.reducer;