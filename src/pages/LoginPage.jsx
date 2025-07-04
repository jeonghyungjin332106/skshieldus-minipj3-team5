// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice';
import { Link } from 'react-router-dom'; // Link 컴포넌트 임포트

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.auth);

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(loginStart()); // 로그인 시작 액션 디스패치

    try {
      // 실제 API 호출 로직은 백엔드 연동 시 추가
      // 지금은 임시로 성공/실패 시뮬레이션 (비동기 처리 시뮬레이션)
      const response = await new Promise(resolve => setTimeout(() => {
        if (username === 'test' && password === '1234') {
          resolve({ success: true, user: { id: 'test', name: '테스트 사용자' }, token: 'fake-jwt-token' });
        } else {
          resolve({ success: false, message: '아이디 또는 비밀번호가 잘못되었습니다.' });
        }
      }, 1000)); // 1초 지연

      if (response.success) {
        dispatch(loginSuccess({ user: response.user, token: response.token }));
        alert('로그인 성공!');
        // 로그인 성공 후 메인 페이지 등으로 리다이렉트 로직은 App.jsx의 PrivateRoute에서 처리
      } else {
        dispatch(loginFailure(response.message));
      }
    } catch (err) {
      dispatch(loginFailure('로그인 중 오류가 발생했습니다.'));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">로그인</h2>
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
        <p className="text-center text-gray-600 text-sm mt-4">
          계정이 없으신가요? <Link to="/register" className="text-blue-500 hover:underline">회원가입</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;