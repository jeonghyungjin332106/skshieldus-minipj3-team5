// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage'; // <-- ResumeAnalysisPage 임포트 추가

// 로그인 된 사용자만 접근 가능한 라우트를 보호하는 컴포넌트
const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useSelector((state) => state.auth);
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

function App() {
  const { isLoggedIn } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* 로그인 페이지 */}
            <Route path="/login" element={<LoginPage />} />
            {/* 회원가입 페이지 */}
            <Route path="/register" element={<RegisterPage />} />

            {/* 대시보드 페이지 (로그인 시에만 접근 가능) */}
            <Route path="/" element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            } />

            {/* --- 중요: 이력서 분석 페이지 라우트 추가 --- */}
            <Route path="/resume-analysis" element={
              <PrivateRoute>
                <ResumeAnalysisPage />
              </PrivateRoute>
            } />
            {/* ------------------------------------------- */}

            {/* 정의되지 않은 모든 경로에 대한Fallback 라우트: 로그인 상태에 따라 리다이렉트 */}
            <Route path="*" element={isLoggedIn ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />

          </Routes>
        </main>
        {/* Footer 컴포넌트가 있다면 여기에 추가 */}
      </div>
    </BrowserRouter>
  );
}

export default App;