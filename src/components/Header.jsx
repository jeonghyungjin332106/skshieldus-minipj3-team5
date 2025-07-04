// src/components/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { toggleDarkMode } from '../features/theme/themeSlice';

function Header() {
  const { isLoggedIn, user } = useSelector((state) => state.auth);
  const { isDarkMode } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    alert('로그아웃 되었습니다.');
    navigate('/login');
  };

  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

  return (
    // 헤더 배경색 및 기본 텍스트 색상 (다크 모드 적용)
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center dark:bg-gray-900 dark:text-gray-100">
      <div className="flex items-center">
        {/* 로고 링크 텍스트 색상 (다크 모드 적용) */}
        <Link to="/" className="text-xl font-bold dark:text-gray-50">AI 커리어 챗봇</Link>
        {isLoggedIn && (
          // 대시보드 링크 버튼 스타일 (다크 모드 적용)
          <Link to="/" className="ml-4 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
            대시보드
          </Link>
        )}
      </div>
      <nav className="flex items-center space-x-4">
        {/* 다크 모드 토글 버튼 */}
        <button
          onClick={handleToggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800"
          aria-label={isDarkMode ? "라이트 모드 전환" : "다크 모드 전환"}
        >
          {isDarkMode ? (
            // 달 아이콘 (다크 모드일 때) - 색상 유지
            <svg className="w-6 h-6 text-yellow-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
          ) : (
            // 해 아이콘 (라이트 모드일 때) - 색상 유지
            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.456 4.63A9.993 9.993 0 0110 18a9.993 9.993 0 01-3.544-.63l-.612.612a1 1 0 01-1.414-1.414l.612-.612A9.993 9.993 0 012 10c0-4.478 3.588-8.1 8-8.1s8 3.622 8 8.1c0 2.222-.9 4.242-2.344 5.63l.612.612a1 1 0 010 1.414l-1.414 1.414a1 1 0 01-1.414 0zM10 0a10 10 0 100 20A10 10 0 0010 0z" clipRule="evenodd"></path></svg>
          )}
        </button>

        {/* 사용 가이드 링크 텍스트 색상 (다크 모드 적용) */}
        <Link to="/guide" className="px-3 py-1 rounded hover:bg-gray-700 transition-colors duration-200 dark:hover:bg-gray-800">
          사용 가이드
        </Link>
        {isLoggedIn ? (
          <div className="flex items-center">
            {/* 환영 메시지 텍스트 색상 (다크 모드 적용) */}
            <span className="mr-4 dark:text-gray-300">환영합니다, {user?.name || user?.id || '사용자'}님!</span>
            <button
              onClick={handleLogout}
              // 로그아웃 버튼 스타일 (다크 모드 적용)
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              로그아웃
            </button>
          </div>
        ) : (
          // 로그인 버튼 스타일 (다크 모드 적용)
          <Link to="/login" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}

export default Header;