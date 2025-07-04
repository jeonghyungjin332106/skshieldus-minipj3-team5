// src/components/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'; // useSelector, useDispatch 임포트
import { logout } from '../features/auth/authSlice'; // logout 액션 임포트

function Header() {
  const { isLoggedIn, user } = useSelector((state) => state.auth); // isLoggedIn과 user 정보 가져오기
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    alert('로그아웃 되었습니다.');
    navigate('/login'); // 로그아웃 후 로그인 페이지로 이동
  };

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Link to="/" className="text-xl font-bold">AI 쿼리 챗봇</Link>
        {isLoggedIn && ( // 로그인 상태일 때만 대시보드 버튼 표시
          <Link to="/" className="ml-4 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700">
            대시보드
          </Link>
        )}
      </div>
      <nav>
        {isLoggedIn ? (
          <div className="flex items-center">
            <span className="mr-4">환영합니다, {user?.name}!</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded bg-red-600 hover:bg-red-700"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <Link to="/login" className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}

export default Header;