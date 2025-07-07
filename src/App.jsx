// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage';
import InterviewQuestionsPage from './pages/InterviewQuestionsPage';
import UserGuidePage from './pages/UserGuidePage';

import { ToastContainer } from 'react-toastify';


const PrivateRoute = ({ children }) => {
    const { isLoggedIn } = useSelector((state) => state.auth);
    // ⭐️⭐️⭐️ PrivateRoute 내부에서 isLoggedIn 값 로그 확인 ⭐️⭐️⭐️
    console.log('PrivateRoute - isLoggedIn:', isLoggedIn);
    return isLoggedIn ? children : <Navigate to="/login" replace />;
};

function App() {
    const { isLoggedIn } = useSelector((state) => state.auth); // App 컴포넌트에서도 isLoggedIn을 사용
    const { isDarkMode } = useSelector((state) => state.theme); // themeSlice가 없다면 이 줄 제거

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
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/guide" element={<UserGuidePage />} />

                        {/* 로그인된 사용자만 접근 가능한 페이지들 (PrivateRoute로 보호) */}
                        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                        <Route path="/resume-analysis" element={<PrivateRoute><ResumeAnalysisPage /></PrivateRoute>} />
                        <Route path="/interview-questions" element={<PrivateRoute><InterviewQuestionsPage /></PrivateRoute>} />

                        {/* 정의되지 않은 모든 경로에 대한 Fallback 라우트 */}
                        {/* 이 라우트도 PrivateRoute와 같은 동작을 할 수 있음 */}
                        <Route path="*" element={isLoggedIn ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />
                    </Routes>
                </main>
                <ToastContainer
                    position="top-right"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme={isDarkMode ? "dark" : "light"}
                />
            </div>
        </BrowserRouter>
    );
}

export default App;