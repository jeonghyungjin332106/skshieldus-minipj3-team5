import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// 페이지 컴포넌트 임포트
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage'; 
import DashboardPage from './pages/DashboardPage';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage';
import InterviewQuestionsPage from './pages/InterviewQuestionsPage';
import UserGuidePage from './pages/UserGuidePage';
import ChatbotPage from './pages/ChatbotPage';
import ConversationHistoryPage from './pages/ConversationHistoryPage';

// 기타 라이브러리 임포트
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 로그인이 필요한 페이지를 감싸는 PrivateRoute 컴포넌트
const PrivateRoute = ({ children }) => {
    const { isLoggedIn } = useSelector((state) => state.auth);
    console.log('PrivateRoute - isLoggedIn:', isLoggedIn);
    return isLoggedIn ? children : <Navigate to="/login" replace />;
};

function App() {
    const { isLoggedIn } = useSelector((state) => state.auth);
    
    // Redux 스토어에서 isDarkMode 상태를 가져옵니다.
    const { isDarkMode } = useSelector((state) => state.theme);

    // isDarkMode 상태(Redux 스토어에서 온 값)가 변경될 때마다 <html> 태그에 'dark' 클래스를 토글합니다.
    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDarkMode]);

    return (
        <BrowserRouter>
            <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
                {/* Header는 이제 Redux에서 직접 상태를 관리하므로 props가 필요 없습니다. */}
                <Header /> 
                
                <main className="flex-grow">
                    <Routes>
                        {/* 공개 경로 */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} /> 
                        <Route path="/guide" element={<UserGuidePage />} />

                        {/* 비공개 경로 (로그인 필요) */}
                        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                        <Route path="/resume-analysis" element={<PrivateRoute><ResumeAnalysisPage /></PrivateRoute>} />
                        <Route path="/interview-questions" element={<PrivateRoute><InterviewQuestionsPage /></PrivateRoute>} />
                        <Route path="/chatbot" element={<PrivateRoute><ChatbotPage /></PrivateRoute>} />
                        <Route path="/chatbot/:id" element={<PrivateRoute><ChatbotPage /></PrivateRoute>} />
                        <Route path="/history" element={<PrivateRoute><ConversationHistoryPage /></PrivateRoute>} />

                        {/* 일치하는 경로가 없을 때 리다이렉트 */}
                        <Route path="*" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
                    </Routes>
                </main>

                <ToastContainer
                    position="bottom-right"
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