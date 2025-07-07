// src/features/interview/interviewSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  generatedQuestions: null, // 생성된 질문 목록
  isLoading: false,         // 질문 생성 진행 중 여부
  error: null,              // 질문 생성 중 발생한 에러 메시지
};

export const interviewSlice = createSlice({
  name: 'interview', // 슬라이스 이름
  initialState,
  reducers: {
    // 질문 생성 시작 (로딩 상태 활성화)
    startQuestionGeneration: (state) => {
      state.isLoading = true;
      state.error = null; // 새로운 생성 시작 시 에러 초기화
      state.generatedQuestions = null; // 새로운 생성 시작 시 이전 결과 초기화
    },
    // 질문 생성 성공 (결과 저장, 로딩 상태 비활성화)
    questionGenerationSuccess: (state, action) => {
      state.isLoading = false;
      state.generatedQuestions = action.payload; // payload는 생성된 질문 목록
      state.error = null;
    },
    // 질문 생성 실패 (에러 메시지 저장, 로딩 상태 비활성화)
    questionGenerationFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload; // payload는 에러 메시지
      state.generatedQuestions = null; // 실패 시 결과 초기화
    },
    // 생성된 질문 초기화
    clearGeneratedQuestions: (state) => {
      state.generatedQuestions = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

// 액션들을 export 합니다.
export const {
  startQuestionGeneration,
  questionGenerationSuccess,
  questionGenerationFailure,
  clearGeneratedQuestions
} = interviewSlice.actions;

// 리듀서를 export 합니다.
export default interviewSlice.reducer;