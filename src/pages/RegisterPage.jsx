// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerStart, registerSuccess, registerFailure, resetRegisterState } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom'; // Link 컴포넌트 임포트 추가

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const dispatch = useDispatch();
  const { isRegistering, registerError, registerSuccess } = useSelector((state) => state.auth);
  const navigate = useNavigate(); // 라우팅 훅

  // 회원가입 성공 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (registerSuccess) {
      alert('회원가입이 성공적으로 완료되었습니다! 로그인 해주세요.');
      dispatch(resetRegisterState()); // 상태 초기화 (다시 회원가입 시도를 위해)
      navigate('/login'); // 로그인 페이지로 이동
    }
  }, [registerSuccess, dispatch, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      dispatch(registerFailure('비밀번호가 일치하지 않습니다.'));
      return;
    }

    dispatch(registerStart()); // 회원가입 시작 액션 디스패치

    try {
      // 실제 API 호출 로직은 백엔드 연동 시 추가
      // 지금은 임시로 성공/실패 시뮬레이션
      const response = await new Promise(resolve => setTimeout(() => {
        if (username && password) { // 간단한 유효성 검사
          // 실제로는 중복 아이디 확인, 비밀번호 정책 등 더 복잡한 로직 필요
          resolve({ success: true, message: '회원가입 성공' });
        } else {
          resolve({ success: false, message: '아이디와 비밀번호를 모두 입력해주세요.' });
        }
      }, 1500)); // 1.5초 지연

      if (response.success) {
        dispatch(registerSuccess());
      } else {
        dispatch(registerFailure(response.message));
      }
    } catch (err) {
      dispatch(registerFailure('회원가입 중 오류가 발생했습니다.'));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">회원가입</h2>
        <form onSubmit={handleRegister}>
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
              disabled={isRegistering}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isRegistering}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2">
              비밀번호 확인
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isRegistering}
              required
            />
          </div>
          {registerError && <p className="text-red-500 text-xs italic mb-4">{registerError}</p>}
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              disabled={isRegistering}
            >
              {isRegistering ? '회원가입 중...' : '회원가입'}
            </button>
          </div>
        </form>
        <p className="text-center text-gray-600 text-sm mt-4">
          이미 계정이 있으신가요? <Link to="/login" className="text-blue-500 hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;