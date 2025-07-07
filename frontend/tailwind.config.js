// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  // --- 중요: darkMode 속성 추가 ---
  darkMode: 'class', // html 태그에 'dark' 클래스가 있으면 다크 모드 활성화
  // -----------------------------
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}