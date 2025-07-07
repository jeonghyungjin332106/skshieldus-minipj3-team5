// src/features/chat/chatSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [], // 채팅 메시지 목록. 각 메시지는 { id: string, sender: 'user' | 'ai', text: string } 형태
  isAiTyping: false, // AI가 응답을 생성 중인지 여부
  error: null, // 채팅 관련 에러 메시지
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // 사용자 메시지 추가
    addUserMessage: (state, action) => {
      state.messages.push({
        id: Date.now() + '-user', // 고유 ID 생성 (간단한 예시)
        sender: 'user',
        text: action.payload, // payload는 사용자 메시지 텍스트
      });
      state.error = null; // 새 메시지 시작 시 에러 초기화
      state.isAiTyping = true; // 사용자 메시지 후 AI가 타이핑 시작
    },
    // AI 메시지 추가
    addAiMessage: (state, action) => {
      state.messages.push({
        id: Date.now() + '-ai', // 고유 ID 생성
        sender: 'ai',
        text: action.payload, // payload는 AI 응답 텍스트
      });
      state.isAiTyping = false; // AI 응답 완료 후 타이핑 종료
    },
    // AI 타이핑 상태 설정
    setAiTyping: (state, action) => {
      state.isAiTyping = action.payload; // true 또는 false
    },
    // 채팅 에러 설정
    setChatError: (state, action) => {
      state.error = action.payload;
      state.isAiTyping = false;
    },
    // 채팅 초기화
    clearChat: (state) => {
      state.messages = [];
      state.isAiTyping = false;
      state.error = null;
    },
    // 특정 질문에 대한 채팅 시작 (초기 메시지 설정)
    startQuestionChat: (state, action) => {
      state.messages = [
        { id: 'initial-q', sender: 'ai', text: `면접 질문: "${action.payload}"\n\n이 질문에 대한 답변을 입력해주세요. AI가 피드백을 드릴 수 있습니다.` }
      ];
      state.isAiTyping = false; // 질문 시작 시 AI는 바로 타이핑하지 않음
      state.error = null;
    }
  },
});

// 액션들을 export 합니다.
export const {
  addUserMessage,
  addAiMessage,
  setAiTyping,
  setChatError,
  clearChat,
  startQuestionChat
} = chatSlice.actions;

// 리듀서를 export 합니다.
export default chatSlice.reducer;