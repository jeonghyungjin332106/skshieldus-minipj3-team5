// src/App.jsx
import React, { useEffect, useState } from 'react'; // useState 임포트 추가 (다크모드 토글용)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
// ⭐️⭐️⭐️ RegisterPage 대신 SignupPage 임포트 ⭐️⭐️⭐️
import SignupPage from './pages/SignupPage'; 
import DashboardPage from './pages/DashboardPage';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage';
import InterviewQuestionsPage from './pages/InterviewQuestionsPage';
import UserGuidePage from './pages/UserGuidePage';

import { ToastContainer } from 'react-toastify';


const PrivateRoute = ({ children }) => {
    const { isLoggedIn } = useSelector((state) => state.auth);
    console.log('PrivateRoute - isLoggedIn:', isLoggedIn);
    return isLoggedIn ? children : <Navigate to="/login" replace />;
};

function App() {
    const { isLoggedIn } = useSelector((state) => state.auth);
    // isDarkMode 상태는 App.jsx에서 직접 관리하거나, themeSlice에서 가져와야 합니다.
    // 현재 themeSlice가 없으므로 App.jsx에서 직접 관리하는 예시를 보여드립니다.
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('theme');
        if (savedMode) {
            return savedMode === 'dark';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // 다크 모드 상태에 따라 HTML 문서에 'dark' 클래스 토글
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light'); // localStorage에 저장
    }, [isDarkMode]);

    // Header 컴포넌트에서 직접 다크 모드 토글 함수를 넘겨주지 않고,
    // Header 내부에서 Redux themeSlice의 toggleDarkMode 액션을 디스패치하도록 변경했으므로,
    // App.jsx에서는 isDarkMode 상태만 useSelector로 가져오고, toggleDarkMode 함수는 Header에서 직접 사용합니다.
    // 만약 themeSlice가 없다면, Header.jsx에서 toggleDarkMode 관련 로직을 제거해야 합니다.

    return (
        <BrowserRouter>
            <div className="flex flex-col min-h-screen">
                {/* Header 컴포넌트는 이제 isDarkMode와 toggleDarkMode를 Redux에서 직접 가져옵니다. */}
                <Header /> 
                <main className="flex-grow">
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        {/* ⭐️⭐️⭐️ /register -> /signup 경로 및 컴포넌트 변경 ⭐️⭐️⭐️ */}
                        <Route path="/signup" element={<SignupPage />} /> 
                        <Route path="/guide" element={<UserGuidePage />} />

                        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                        <Route path="/resume-analysis" element={<PrivateRoute><ResumeAnalysisPage /></PrivateRoute>} />
                        <Route path="/interview-questions" element={<PrivateRoute><InterviewQuestionsPage /></PrivateRoute>} />

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