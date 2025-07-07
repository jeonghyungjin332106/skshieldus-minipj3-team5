// src/pages/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// loginSuccess 액션도 임포트합니다.
import { registerStart, registerSuccess, registerFailure, resetRegisterState, loginSuccess } from '../features/auth/authSlice'; 
import { useNavigate, Link } from 'react-router-dom';
import { notifySuccess, notifyError } from '../components/Notification';
import axios from 'axios';

// 백엔드 API 기본 URL (Vite 프록시 설정을 위해 '/api'로 설정)
const BACKEND_API_BASE_URL = '/api'; 

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userName, setUserName] = useState(''); // userName 상태

    const dispatch = useDispatch();
    const { isRegistering, registerError, registerSuccess } = useSelector((state) => state.auth); 
    const navigate = useNavigate();

    // 회원가입 성공 시 로그인 페이지로 리다이렉트 (registerSuccess가 true일 때만 동작)
    useEffect(() => {
        if (registerSuccess) {
            console.log("회원가입 성공 플래그 감지, 로그인 페이지로 이동합니다.");
            notifySuccess('회원가입이 성공적으로 완료되었습니다! 로그인 해주세요.', {
                position: "top-center",
                autoClose: 3000,
            });
            dispatch(resetRegisterState()); // 회원가입 상태 초기화 (registerSuccess 플래그 false로 되돌림)
            navigate('/login'); // 로그인 페이지로 이동
        }
    }, [registerSuccess, dispatch, navigate]); // registerSuccess 변화에 반응

    const handleRegister = async (e) => {
        e.preventDefault();

        // 폼 유효성 검사 (클라이언트 측 1차 검증)
        if (!username || !password || !confirmPassword || !userName) {
            dispatch(registerFailure('모든 필드를 입력해주세요.'));
            notifyError('모든 필드를 입력해주세요.');
            return;
        }
        if (password !== confirmPassword) {
            dispatch(registerFailure('비밀번호가 일치하지 않습니다.'));
            notifyError('비밀번호가 일치하지 않습니다.');
            return;
        }
        // 비밀번호 백엔드 유효성 검사 규칙에 맞게 클라이언트 측 검증
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            dispatch(registerFailure('비밀번호는 영문, 숫자, 특수문자를 각 1개 이상 포함하고 8자 이상이어야 합니다.'));
            notifyError('비밀번호는 영문, 숫자, 특수문자를 각 1개 이상 포함하고 8자 이상이어야 합니다.');
            return;
        }

        dispatch(registerStart()); // 회원가입 시작 액션

        try {
            // 백엔드 회원가입 API 호출
            const response = await axios.post(`${BACKEND_API_BASE_URL}/auth/signup`, { 
                loginId: username, 
                password: password,
                userName: userName, 
            }, {
                timeout: 10000 
            });

            if (response.status === 200 || response.status === 201) {
                // ⭐️⭐️⭐️ 백엔드 응답에서 토큰 및 사용자 정보 추출 ⭐️⭐️⭐️
                const { token, user } = response.data; // 백엔드 응답 데이터 구조에 따라 조정 (예: userDto, token 필드)

                if (token && user) { // ✅ 회원가입 성공 후 백엔드가 자동으로 토큰과 사용자 정보를 반환하는 경우
                    dispatch(loginSuccess({ user: user, token: token })); // loginSuccess 액션 디스패치 (자동 로그인 처리)
                    notifySuccess(`회원가입 성공 및 자동 로그인! 환영합니다, ${user.userName || user.loginId || '새 사용자'}님!`);
                    // loginSuccess 액션 디스패치 시 App.jsx의 PrivateRoute나 다른 라우팅 로직에 의해 자동으로 대시보드로 이동합니다.
                } else { // ❌ 백엔드가 단순히 회원가입 성공만 알리고 토큰을 반환하지 않는 경우
                    dispatch(registerSuccess()); // registerSuccess 액션 디스패치 (useEffect가 /login으로 리다이렉트)
                    // 이 경우 사용자는 /login 페이지에서 다시 아이디/비밀번호로 로그인해야 합니다.
                }
            } else {
                // 백엔드에서 특정 상태 코드로 실패를 알릴 경우
                const errorMessage = response.data?.message || `회원가입 실패: ${response.status} ${response.statusText}`;
                dispatch(registerFailure(errorMessage));
                notifyError(errorMessage);
            }
        } catch (err) {
            console.error("회원가입 중 오류 발생:", err.response ? err.response.data : err.message);
            const errorMessage = err.response?.data?.message || err.message || '회원가입 중 알 수 없는 오류가 발생했습니다.';
            dispatch(registerFailure(errorMessage));
            notifyError(errorMessage);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm dark:bg-gray-700">
                <h2 className="text-2xl font-bold text-center mb-6 dark:text-gray-50">
                    회원가입
                </h2>
                <form onSubmit={handleRegister}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                            아이디
                        </label>
                        <input
                            type="text"
                            id="username"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isRegistering}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="userName" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                            이름
                        </label>
                        <input
                            type="text"
                            id="userName"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            disabled={isRegistering}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isRegistering}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                            비밀번호 확인
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isRegistering}
                            required
                        />
                    </div>
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
                <p className="text-center text-gray-600 text-sm mt-4 dark:text-gray-400">
                    이미 계정이 있으신가요? <Link to="/login" className="text-blue-500 hover:underline dark:text-blue-400">로그인</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;