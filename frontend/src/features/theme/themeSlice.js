// src/features/theme/themeSlice.js
import { createSlice } from '@reduxjs/toolkit';

// 로컬 스토리지에서 다크 모드 선호도 로드
const loadDarkModePreference = () => {
  try {
    const serializedPreference = localStorage.getItem('isDarkMode');
    if (serializedPreference === null) {
      // 로컬 스토리지에 없으면 시스템 기본 설정을 따릅니다.
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return JSON.parse(serializedPreference);
  } catch (err) {
    console.error("Error loading dark mode preference from localStorage:", err);
    return false; // 오류 발생 시 기본값은 라이트 모드
  }
};

const initialState = {
  isDarkMode: loadDarkModePreference(), // 초기값은 로컬 스토리지 또는 시스템 설정
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    // 다크 모드 토글
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
      // 변경된 선호도를 로컬 스토리지에 저장
      localStorage.setItem('isDarkMode', JSON.stringify(state.isDarkMode));
    },
    // 다크 모드 강제 설정 (선택 사항, 필요시)
    setDarkMode: (state, action) => {
      state.isDarkMode = action.payload;
      localStorage.setItem('isDarkMode', JSON.stringify(state.isDarkMode));
    },
  },
});

export const { toggleDarkMode, setDarkMode } = themeSlice.actions;

export default themeSlice.reducer;