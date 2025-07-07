// src/features/analysis/analysisSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  results: null, // 분석 결과 데이터 (예: { summary, skills, recommendations })
  isLoading: false, // 분석 진행 중 여부
  error: null, // 분석 중 발생한 에러 메시지
};

export const analysisSlice = createSlice({
  name: 'analysis', // 슬라이스 이름
  initialState,
  reducers: {
    // 분석 시작 (로딩 상태 활성화)
    startAnalysis: (state) => {
      state.isLoading = true;
      state.error = null; // 새로운 분석 시작 시 에러 초기화
      state.results = null; // 새로운 분석 시작 시 이전 결과 초기화
    },
    // 분석 성공 (결과 저장, 로딩 상태 비활성화)
    analysisSuccess: (state, action) => {
      state.isLoading = false;
      state.results = action.payload; // payload는 분석 결과 데이터
      state.error = null;
    },
    // 분석 실패 (에러 메시지 저장, 로딩 상태 비활성화)
    analysisFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload; // payload는 에러 메시지
      state.results = null; // 실패 시 결과 초기화
    },
    // 분석 결과 초기화
    clearAnalysis: (state) => {
      state.results = null;
      state.isLoading = false;
      state.error = null;
    },
  },
});

// 액션들을 export 합니다.
export const { startAnalysis, analysisSuccess, analysisFailure, clearAnalysis } = analysisSlice.actions;

// 리듀서를 export 합니다.
export default analysisSlice.reducer;