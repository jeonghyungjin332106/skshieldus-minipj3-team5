import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// 페이지 및 컴포넌트 임포트
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage';
import InterviewQuestionsPage from './pages/InterviewQuestionsPage';
import UserGuidePage from './pages/UserGuidePage';
import ChatbotPage from './pages/ChatbotPage';
import ConversationHistoryPage from './pages/ConversationHistoryPage';

// 기타 라이브러리 임포트 (알림)
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * 로그인이 필요한 경로를 보호하는 헬퍼 컴포넌트입니다.
 * 사용자가 로그인되어 있지 않으면 로그인 페이지로 리디렉션합니다.
 * @param {object} props - PrivateRoute 컴포넌트에 전달되는 props
 * @param {React.ReactNode} props.children - 보호된 경로에 렌더링될 자식 컴포넌트
 */
const PrivateRoute = ({ children }) => {
    const { isLoggedIn } = useSelector((state) => state.auth);
    console.log('PrivateRoute - isLoggedIn:', isLoggedIn); // 디버깅 용도
    return isLoggedIn ? children : <Navigate to="/login" replace />;
};

/**
 * 애플리케이션의 최상위 컴포넌트입니다.
 * 라우팅 설정, 전역 상태(다크 모드) 관리, 헤더 및 알림 컨테이너를 포함합니다.
 */
function App() {
    // Redux 스토어에서 인증 및 테마 상태를 가져옵니다.
    const { isLoggedIn } = useSelector((state) => state.auth);
    const { isDarkMode } = useSelector((state) => state.theme);

    /**
     * `isDarkMode` 상태(Redux 스토어에서 온 값)가 변경될 때마다
     * HTML 문서의 루트 요소(`<html>`)에 'dark' 클래스를 토글합니다.
     * 이는 Tailwind CSS의 다크 모드 활성화에 사용됩니다.
     */
    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDarkMode]); // isDarkMode가 변경될 때만 실행

    return (
        <BrowserRouter>
            {/* 전체 애플리케이션 레이아웃 컨테이너 */}
            <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
                {/* 모든 페이지에 공통으로 표시될 헤더 */}
                <Header />

                {/* 페이지 콘텐츠가 렌더링될 메인 영역 */}
                <main className="flex-grow">
                    <Routes>
                        {/* 공개적으로 접근 가능한 경로들 */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/guide" element={<UserGuidePage />} />

                        {/* 로그인이 필요한 비공개 경로들 */}
                        {/* 기본 경로 ('/')는 로그인 후 대시보드로 리디렉션 */}
                        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                        <Route path="/resume-analysis" element={<PrivateRoute><ResumeAnalysisPage /></PrivateRoute>} />
                        <Route path="/interview-questions" element={<PrivateRoute><InterviewQuestionsPage /></PrivateRoute>} />
                        <Route path="/chatbot" element={<PrivateRoute><ChatbotPage /></PrivateRoute>} />
                        <Route path="/chatbot/:id" element={<PrivateRoute><ChatbotPage /></PrivateRoute>} /> {/* 특정 대화 기록 로드 경로 */}
                        <Route path="/history" element={<PrivateRoute><ConversationHistoryPage /></PrivateRoute>} />

                        {/* 정의된 경로와 일치하지 않는 모든 경로 처리 */}
                        {/* 로그인 상태에 따라 대시보드 또는 로그인 페이지로 리디렉션 */}
                        <Route
                            path="*"
                            element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
                        />
                    </Routes>
                </main>

                {/* 전역 알림 컨테이너 (react-toastify) */}
                <ToastContainer
                    position="bottom-right" // 알림 위치
                    autoClose={3000}        // 자동 닫힘 시간 (3초)
                    hideProgressBar={false} // 진행률 바 표시
                    newestOnTop={false}     // 새로운 알림이 위에 표시될지 여부
                    closeOnClick            // 클릭 시 알림 닫힘
                    rtl={false}             // RTL (Right To Left) 레이아웃 사용 여부
                    pauseOnFocusLoss        // 포커스 손실 시 알림 일시 정지
                    draggable               // 알림 드래그 가능 여부
                    pauseOnHover            // 호버 시 알림 일시 정지
                    theme={isDarkMode ? "dark" : "light"} // 다크 모드에 따라 알림 테마 변경
                />
            </div>
        </BrowserRouter>
    );
}

export default App;