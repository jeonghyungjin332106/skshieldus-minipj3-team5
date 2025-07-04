// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  // isLoggedIn 상태도 가져옵니다.
  const { isLoading, error, registeredUsers, isLoggedIn } = useSelector((state) => state.auth); // isLoggedIn 추가
  console.log("LoginPage 렌더링 - isLoggedIn:", isLoggedIn);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const foundUser = registeredUsers.find(
        (user) => user.username === username && user.password === password
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (foundUser) {
        dispatch(loginSuccess({ user: { id: foundUser.username, name: foundUser.username }, token: 'demo-jwt-token-for-' + foundUser.username }));
        alert(`로그인 성공! 환영합니다, ${foundUser.username}님!`);
        navigate('/'); // 로그인 성공 후 대시보드 페이지로 자동 이동
      } else {
        dispatch(loginFailure('아이디 또는 비밀번호가 잘못되었거나, 등록되지 않은 사용자입니다.'));
      }
    } catch (err) {
      console.error("로그인 중 오류 발생:", err);
      dispatch(loginFailure('로그인 중 오류가 발생했습니다. (자세한 내용은 콘솔 확인)'));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
        {/* 로그인 폼 */}
        {!isLoggedIn ? ( // 로그인되지 않았을 때만 폼을 표시
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
                아이디
              </label>
              <input
                type="text"
                id="username"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </div>
          </form>
        ) : ( // 로그인되었을 때 대시보드 버튼 표시
          <div className="text-center">
            <p className="text-gray-700 text-lg mb-6">이미 로그인되어 있습니다.</p>
            <Link to="/" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block">
              대시보드로 이동
            </Link>
          </div>
        )}

        {/* 회원가입 링크는 로그인 상태와 무관하게 항상 표시 */}
        <p className="text-center text-gray-600 text-sm mt-4">
          계정이 없으신가요? <Link to="/register" className="text-blue-500 hover:underline">회원가입</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;