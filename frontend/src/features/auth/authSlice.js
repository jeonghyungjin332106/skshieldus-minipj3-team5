// src/features/auth/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

// localStorage에서 상태를 불러오는 함수 (변경 없음)
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('auth');
    if (serializedState === null) {
      return undefined;
    }
    const storedState = JSON.parse(serializedState);
    return {
      ...storedState,
      isLoading: false,
      error: null,
      isRegistering: false,
      registerError: null,
      registerSuccess: false,
    };
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return undefined;
  }
};

// localStorage에 상태를 저장하는 함수 (변경 없음)
const saveState = (state) => {
  try {
    const stateToPersist = {
      isLoggedIn: state.isLoggedIn,
      user: state.user,
      token: state.token,
      registeredUsers: state.registeredUsers,
    };
    const serializedState = JSON.stringify(stateToPersist);
    localStorage.setItem('auth', serializedState);
  } catch (err) {
    console.error("Error saving state to localStorage:", err);
  }
};

// 초기 상태 설정 (loadState 함수를 통해 localStorage에서 불러오거나 기본값 사용)
const initialState = loadState() || {
  isLoggedIn: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isRegistering: false,
  registerError: null,
  registerSuccess: false,
  registeredUsers: [],
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
      saveState(state); // 로그인 성공 시 현재 Redux 상태를 localStorage에 저장
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.isLoggedIn = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
      // 실패 시에도 localStorage의 로그인 상태를 명확히 false로 업데이트
      saveState(state); 
    },
    // ⭐️⭐️⭐️ logout 리듀서 수정 ⭐️⭐️⭐️
    logout: (state) => {
      state.isLoggedIn = false; // Redux 상태를 로그아웃으로 변경
      state.user = null;        // 사용자 정보 초기화
      state.token = null;       // 토큰 정보 초기화
      state.error = null;       // 오류 초기화
      state.isRegistering = false; // 회원가입 관련 플래그 초기화
      state.registerError = null;
      state.registerSuccess = false;
      
      // ⭐️⭐️⭐️ 수정: 복잡한 loadState 호출 없이, 변경된 현재 Redux 상태를 직접 저장합니다. ⭐️⭐️⭐️
      saveState(state); // 로그아웃 후 변경된 Redux 상태를 localStorage에 저장
    },
    registerStart: (state) => {
      state.isRegistering = true;
      state.registerError = null;
      state.registerSuccess = false;
    },
    registerSuccess: (state) => {
      state.isRegistering = false;
      state.registerSuccess = true;
      state.registerError = null;
      // saveState(state); // registerSuccess 시에는 보통 자동으로 로그인되지 않으면 저장 안 함
    },
    registerFailure: (state, action) => {
      state.isRegistering = false;
      state.registerSuccess = false;
      state.registerError = action.payload;
      saveState(state); // 실패 시에도 localStorage의 회원가입 상태를 명확히 false로 업데이트
    },
    resetRegisterState: (state) => {
      state.isRegistering = false;
      state.registerError = null;
      state.registerSuccess = false;
      // saveState(state); // 리셋 시에도 localStorage에 저장하여 상태 동기화
    },
    addRegisteredUser: (state, action) => { // 백엔드 연동 후 불필요할 수 있음
      const { username, password } = action.payload;
      const userExists = state.registeredUsers.some(user => user.username === username);
      if (!userExists) {
        state.registeredUsers.push({ username, password });
        saveState(state);
      }
    }
  },
});

export const { loginStart, loginSuccess, loginFailure, logout,
               registerStart, registerSuccess, registerFailure, resetRegisterState,
               addRegisteredUser
             } = authSlice.actions;

export default authSlice.reducer;