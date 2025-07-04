// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'; // 라우팅 관련 추가
import { useSelector } from 'react-redux';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; // 회원가입 페이지 임포트

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

            {/* 메인 페이지 (로그인 시에만 접근 가능) */}
            <Route path="/" element={
              <PrivateRoute>
                <div className="p-4 text-center">
                  <h2 className="text-3xl font-bold mt-8">메인 페이지 - 서비스 이용 시작!</h2>
                  <p className="mt-4 text-lg">파일을 첨부하거나 텍스트를 입력하여 커리어 상담을 시작하세요.</p>
                  {/* 여기에 ContentUpload, ChatWindow 등의 컴포넌트가 들어갈 예정 */}
                </div>
              </PrivateRoute>
            } />

            {/* 로그인 되어있으면 메인으로, 아니면 로그인 페이지로 리다이렉트 */}
            <Route path="*" element={isLoggedIn ? <Navigate to="/" replace /> : <Navigate to="/login" replace />} />

          </Routes>
        </main>
        {/* Footer 컴포넌트가 있다면 여기에 추가 */}
      </div>
    </BrowserRouter>
  );
}

export default App;