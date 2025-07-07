// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
// --- 중요: ResumeAnalysisPage 임포트 경로 수정 확인 ---
import ResumeAnalysisPage from './pages/ResumeAnalysisPage'; // "./pages/pages/ResumeAnalysisPage" -> "./pages/ResumeAnalysisPage"로 수정
// ---------------------------------------------------
import InterviewQuestionsPage from './pages/InterviewQuestionsPage';
import UserGuidePage from './pages/UserGuidePage';

// --- react-toastify 임포트 확인 ---
import { ToastContainer } from 'react-toastify';
// ------------------------------------

const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useSelector((state) => state.auth);
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

function App() {
  const { isLoggedIn } = useSelector((state) => state.auth);
  const { isDarkMode } = useSelector((state) => state.theme);

  // 다크 모드 상태에 따라 HTML 문서에 'dark' 클래스 토글
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* 로그인 및 회원가입 페이지 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* 사용자 가이드 페이지 */}
            <Route path="/guide" element={<UserGuidePage />} />

            {/* 로그인된 사용자만 접근 가능한 페이지들 (PrivateRoute로 보호) */}
            <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/resume-analysis" element={<PrivateRoute><ResumeAnalysisPage /></PrivateRoute>} />
            <Route path="/interview-questions" element={<PrivateRoute><InterviewQuestionsPage /></PrivateRoute>} />

            {/* 정의되지 않은 모든 경로에 대한 Fallback 라우트 */}
            <Route path="*" element={isLoggedIn ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
          </Routes>
        </main>
        {/* --- ToastContainer 설정 확인 --- */}
        <ToastContainer
          position="top-right" // 알림 위치
          autoClose={3000} // 3초 후 자동 닫힘
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isDarkMode ? "dark" : "light"} // 다크 모드 테마 적용
        />
        {/* ---------------------------------- */}
      </div>
    </BrowserRouter>
  );
}

export default App;