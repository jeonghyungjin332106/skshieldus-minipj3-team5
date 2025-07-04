// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerStart, registerSuccess, registerFailure, resetRegisterState } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';

function RegisterPage() {
  const [name, setName] = useState(''); // 사용자 이름
  const [dateOfBirth, setDateOfBirth] = useState(''); // 생년월일
  const [username, setUsername] = useState(''); // 아이디
  const [password, setPassword] = useState(''); // 비밀번호
  const [confirmPassword, setConfirmPassword] = useState(''); // 비밀번호 확인

  const dispatch = useDispatch();
  const { isRegistering, registerError, registerSuccess } = useSelector((state) => state.auth);
  const navigate = useNavigate();

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

    // 모든 필수 필드 유효성 검사
    if (!name || !dateOfBirth || !username || !password) {
        dispatch(registerFailure('모든 필수 정보를 입력해주세요.'));
        return;
    }

    dispatch(registerStart()); // 회원가입 시작 액션 디스패치

    try {
      // 실제 API 호출 로직은 백엔드 연동 시 추가
      // 지금은 임시로 성공/실패 시뮬레이션
      const response = await new Promise(resolve => setTimeout(() => {
        // 실제 백엔드로는 name, dateOfBirth, username, password를 전송합니다.
        if (name && dateOfBirth && username && password) {
          resolve({ success: true, message: '회원가입 성공' });
        } else {
          resolve({ success: false, message: '모든 필수 정보를 입력해주세요.' });
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
          {/* 이름 입력 필드 (순서 변경) */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              이름
            </label>
            <input
              type="text"
              id="name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isRegistering}
              required
            />
          </div>

          {/* 생년월일 입력 필드 (순서 변경) */}
          <div className="mb-6">
            <label htmlFor="dateOfBirth" className="block text-gray-700 text-sm font-bold mb-2">
              생년월일
            </label>
            <input
              type="date" // type을 'date'로 변경하여 날짜 선택 UI 제공
              id="dateOfBirth"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              disabled={isRegistering}
              required
            />
          </div>

          {/* 아이디 입력 필드 (순서 변경) */}
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

          {/* 비밀번호 입력 필드 */}
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

          {/* 비밀번호 확인 입력 필드 */}
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