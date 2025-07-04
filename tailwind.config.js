// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // src 폴더의 모든 JS, TS, JSX, TSX 파일을 스캔
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}