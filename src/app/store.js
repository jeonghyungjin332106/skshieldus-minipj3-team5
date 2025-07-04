// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import analysisReducer from '../features/analysis/analysisSlice'; // <-- analysisSlice 임포트

export const store = configureStore({
  reducer: {
    auth: authReducer,
    analysis: analysisReducer, // <-- analysisReducer를 'analysis'라는 이름으로 등록
  },
});