// src/pages/SignupPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerStart, registerSuccess, registerFailure, resetRegisterState, loginSuccess } from '../features/auth/authSlice'; 
import { useNavigate, Link } from 'react-router-dom';
import { notifySuccess, notifyError } from '../components/Notification';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner'; // LoadingSpinner 임포트 추가

// 백엔드 API 기본 URL (Vite 프록시 설정을 위해 '/api'로 설정)
const BACKEND_API_BASE_URL = '/api'; 

// ⭐️⭐️⭐️ 컴포넌트 이름 변경: RegisterPage -> SignupPage ⭐️⭐️⭐️
function SignupPage() {
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
            dispatch(resetRegisterState());
            navigate('/login'); // 로그인 페이지로 이동
        }
    }, [registerSuccess, dispatch, navigate]);

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
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            dispatch(registerFailure('비밀번호는 영문, 숫자, 특수문자를 각 1개 이상 포함하고 8자 이상이어야 합니다.'));
            notifyError('비밀번호는 영문, 숫자, 특수문자를 각 1개 이상 포함하고 8자 이상이어야 합니다.');
            return;
        }

        dispatch(registerStart());

        try {
            const response = await axios.post(`${BACKEND_API_BASE_URL}/auth/signup`, { 
                loginId: username, 
                password: password,
                userName: userName, 
            }, {
                timeout: 10000 
            });

            if (response.status === 200 || response.status === 201) {
                const { token, user } = response.data; 

                if (token && user) { 
                    dispatch(loginSuccess({ user: user, token: token }));
                    notifySuccess(`회원가입 성공 및 자동 로그인! 환영합니다, ${user.userName || user.loginId || '새 사용자'}님!`);
                } else { 
                    dispatch(registerSuccess());
                }
            } else {
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
                            {/* ⭐️⭐️⭐️ 로딩 스피너 적용 ⭐️⭐️⭐️ */}
                            {isRegistering ? (
                                <span className="flex items-center justify-center">
                                    <LoadingSpinner size="sm" color="white" /> {/* 버튼 내부이므로 sm 사이즈, 흰색 */}
                                    <span className="ml-2">회원가입 중...</span>
                                </span>
                            ) : (
                                '회원가입'
                            )}
                            {/* --------------------------- */}
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

// ⭐️⭐️⭐️ 컴포넌트 export 이름 변경: RegisterPage -> SignupPage ⭐️⭐️⭐️
export default SignupPage;