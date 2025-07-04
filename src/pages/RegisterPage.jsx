// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerStart, registerFailure, resetRegisterState, addRegisteredUser, authSlice } from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
// --- 중요: Notification.jsx에서 알림 함수들 임포트 ---
import { notifySuccess, notifyError, notifyWarn } from '../components/Notification';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const dispatch = useDispatch();
  const { isRegistering, registerError, registerSuccess, registeredUsers } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  // 회원가입 성공 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (registerSuccess) {
      console.log("회원가입 성공, 로그인 페이지로 이동합니다.");
      // 기존 alert 대신 notifySuccess 사용
      // alert('회원가입이 성공적으로 완료되었습니다! 로그인 해주세요.');
      notifySuccess('회원가입이 성공적으로 완료되었습니다! 로그인 해주세요.', {
          position: "top-center", // 중앙 상단에 표시
          autoClose: 3000,
      });
      dispatch(resetRegisterState()); // 회원가입 상태 초기화
      navigate('/login'); // 로그인 페이지로 이동
    }
  }, [registerSuccess, dispatch, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();

    console.log("회원가입 시도:", { username, password, confirmPassword });

    // 비밀번호 일치 확인
    if (password !== confirmPassword) {
      dispatch(registerFailure('비밀번호가 일치하지 않습니다.')); // Redux 상태 업데이트
      notifyError('비밀번호가 일치하지 않습니다.'); // 사용자에게 토스트 알림
      console.error("오류: 비밀번호 불일치");
      return;
    }

    // 데모용: 아이디 중복 확인 (registeredUsers 목록 활용)
    const userExistsInDemo = registeredUsers.some(user => user.username === username);
    if (userExistsInDemo) {
        dispatch(registerFailure(`아이디 '${username}'는 이미 존재합니다.`)); // Redux 상태 업데이트
        notifyWarn(`아이디 '${username}'는 이미 존재합니다.`); // 사용자에게 토스트 알림
        console.error("오류: 아이디 중복", username);
        return;
    }

    dispatch(registerStart()); // 회원가입 시작 액션 디스패치 (로딩 상태 활성화)

    try {
      // 1.5초 지연 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 아이디와 비밀번호가 비어있지 않으면 성공으로 간주
      if (username && password) {
        console.log("시뮬레이션 성공 조건 만족.");
        dispatch(addRegisteredUser({ username, password })); // 등록된 사용자 정보 저장 액션
        dispatch(authSlice.actions.registerSuccess()); // 회원가입 성공 액션
      } else {
        console.error("오류: 아이디 또는 비밀번호가 비어있음.");
        dispatch(registerFailure('아이디와 비밀번호를 모두 입력해주세요.')); // Redux 상태 업데이트
        notifyError('아이디와 비밀번호를 모두 입력해주세요.'); // 사용자에게 토스트 알림
      }
    } catch (err) {
      // 이 catch 블록에 도달했다면 심각한 JavaScript 런타임 오류일 가능성이 높습니다.
      console.error("회원가입 비동기 처리 중 예상치 못한 오류 발생:", err);
      dispatch(registerFailure('회원가입 중 오류가 발생했습니다. (자세한 내용은 콘솔 확인)')); // Redux 상태 업데이트
      notifyError('회원가입 중 오류가 발생했습니다. (자세한 내용은 콘솔 확인)'); // 사용자에게 토스트 알림
    }
  };

  return (
    // 페이지 전체 배경색 및 기본 텍스트 색상
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {/* 회원가입 박스 배경 및 그림자 */}
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm dark:bg-gray-700">
        {/* 제목 텍스트 색상 */}
        <h2 className="text-2xl font-bold text-center mb-6 dark:text-gray-50">
          회원가입
        </h2>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            {/* 라벨 텍스트 색상 */}
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
              아이디
            </label>
            <input
              type="text"
              id="username"
              // 입력 필드 스타일: 배경, 테두리, 텍스트 색상 (다크 모드 적용)
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isRegistering}
              required
            />
          </div>
          <div className="mb-4">
            {/* 라벨 텍스트 색상 */}
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              // 입력 필드 스타일: 배경, 테두리, 텍스트 색상 (다크 모드 적용)
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isRegistering}
              required
            />
          </div>
          <div className="mb-6">
            {/* 라벨 텍스트 색상 */}
            <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
              비밀번호 확인
            </label>
            <input
              type="password"
              id="confirmPassword"
              // 입력 필드 스타일: 배경, 테두리, 텍스트 색상 (다크 모드 적용)
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isRegistering}
              required
            />
          </div>
          {/* 에러 메시지 텍스트 색상 */}
          {registerError && <p className="text-red-500 text-xs italic mb-4 dark:text-red-300">{registerError}</p>}
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
        {/* 로그인 링크 텍스트 색상 */}
        <p className="text-center text-gray-600 text-sm mt-4 dark:text-gray-400">
          이미 계정이 있으신가요? <Link to="/login" className="text-blue-500 hover:underline dark:text-blue-400">로그인</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;