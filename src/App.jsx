// src/App.jsx
import React, { useEffect } from 'react'; // useEffect 임포트 추가
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage';
import InterviewQuestionsPage from './pages/InterviewQuestionsPage';
import UserGuidePage from './pages/UserGuidePage';

const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useSelector((state) => state.auth);
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

function App() {
  const { isLoggedIn } = useSelector((state) => state.auth);
  // --- 중요: isDarkMode 상태 가져오기 ---
  const { isDarkMode } = useSelector((state) => state.theme);

  // isDarkMode 상태가 변경될 때마다 html 태그에 'dark' 클래스 토글
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  // ------------------------------------

  return (
    <BrowserRouter>
      {/* App 컴포넌트 자체에는 배경색을 지정하지 않습니다. Tailwind가 html/body에 적용합니다. */}
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/guide" element={<UserGuidePage />} />

            <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/resume-analysis" element={<PrivateRoute><ResumeAnalysisPage /></PrivateRoute>} />
            <Route path="/interview-questions" element={<PrivateRoute><InterviewQuestionsPage /></PrivateRoute>} />

            <Route path="*" element={isLoggedIn ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;