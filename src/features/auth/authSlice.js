// src/features/auth/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const loadState = () => {
  try {
    const serializedState = localStorage.getItem('auth');
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return undefined;
  }
};

const initialState = loadState() || {
  isLoggedIn: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  // 회원가입 관련 상태 추가
  isRegistering: false, // 회원가입 진행 중 여부
  registerError: null,  // 회원가입 에러 메시지
  registerSuccess: false // 회원가입 성공 여부
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.isLoggedIn = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
      localStorage.setItem('auth', JSON.stringify({
        isLoggedIn: true,
        user: action.payload.user,
        token: action.payload.token,
      }));
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.isLoggedIn = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
      localStorage.removeItem('auth');
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('auth');
      // 로그아웃 시 회원가입 관련 상태도 초기화
      state.isRegistering = false;
      state.registerError = null;
      state.registerSuccess = false;
    },
    // --- 회원가입 관련 Reducer 추가 ---
    registerStart: (state) => {
      state.isRegistering = true;
      state.registerError = null;
      state.registerSuccess = false;
    },
    registerSuccess: (state) => {
      state.isRegistering = false;
      state.registerSuccess = true;
      state.registerError = null;
    },
    registerFailure: (state, action) => {
      state.isRegistering = false;
      state.registerSuccess = false;
      state.registerError = action.payload;
    },
    resetRegisterState: (state) => { // 회원가입 상태 초기화 (다른 페이지 이동 시 등)
      state.isRegistering = false;
      state.registerError = null;
      state.registerSuccess = false;
    }
  },
});

// 새로 추가된 액션들을 export 합니다.
export const { loginStart, loginSuccess, loginFailure, logout,
               registerStart, registerSuccess, registerFailure, resetRegisterState } = authSlice.actions;

export default authSlice.reducer;