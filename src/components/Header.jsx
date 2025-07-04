// src/components/Header.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';

function Header() {
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    alert('로그아웃 되었습니다.');
    // 로그아웃 후 로그인 페이지 등으로 리다이렉트 로직 추가 필요 (React Router DOM 사용)
  };

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">AI 커리어 챗봇</h1>
        <nav>
          {isLoggedIn ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">환영합니다, {user?.name || '사용자'}님!</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              // 나중에 React Router DOM을 사용하여 로그인 페이지로 이동
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md transition duration-300"
            >
              로그인
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;