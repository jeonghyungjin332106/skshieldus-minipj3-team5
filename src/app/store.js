// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer, // authSlice의 리듀서를 'auth'라는 이름으로 등록
  },
});