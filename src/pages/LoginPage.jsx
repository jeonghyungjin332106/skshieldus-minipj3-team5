// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { notifySuccess, notifyError } from '../components/Notification';
import axios from 'axios';

// 백엔드 API 기본 URL (Vite 프록시 설정을 위해 '/api'로 변경)
const BACKEND_API_BASE_URL = '/api';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const { isLoading, error, isLoggedIn } = useSelector((state) => state.auth); 
    const navigate = useNavigate();

    // ⭐️⭐️⭐️ 이 useEffect가 로그인 상태에 따라 리다이렉트를 처리합니다. ⭐️⭐️⭐️
    useEffect(() => {
        if (isLoggedIn) { // 로그인되어 있다면
            navigate('/', { replace: true }); // 즉시 대시보드로 이동 (history에 남기지 않음)
        }
        // 이 useEffect는 로그인 성공 시, 그리고 새로고침 시 로그인 상태일 때만 작동하여,
        // LoginPage에 '이미 로그인되어 있습니다.' 메시지가 뜨는 것을 방지합니다.
    }, [isLoggedIn, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        dispatch(loginStart());

        try {
            const response = await axios.post(`${BACKEND_API_BASE_URL}/auth/login`, { 
                loginId: username, 
                password: password,
            }, {
                timeout: 10000 
            });

            const { accessToken, userName, userId } = response.data; 

            const user = { 
                userId: userId, 
                userName: userName,
                loginId: username
            };

            dispatch(loginSuccess({ user: user, token: accessToken })); 
            
            notifySuccess(`로그인 성공! 환영합니다, ${userName}님!`); 
            
            // navigate('/')는 위 useEffect에서 처리되므로 여기서는 필요 없습니다.
            // navigate('/'); 

        } catch (err) {
            console.error("로그인 중 오류 발생:", err.response ? err.response.data : err.message);
            const errorMessage = err.response?.data?.message || err.message || '로그인 중 알 수 없는 오류가 발생했습니다.';
            dispatch(loginFailure(errorMessage)); 
            notifyError(errorMessage);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm dark:bg-gray-700">
                <h2 className="text-2xl font-bold text-center mb-6 dark:text-gray-50">
                    로그인
                </h2>
                {/* ⭐️⭐️⭐️ isLoggedIn이 true일 때의 메시지 블록을 제거합니다. ⭐️⭐️⭐️ */}
                {/* {!isLoggedIn ? (
                    <form onSubmit={handleLogin}>
                        ... (로그인 폼) ...
                    </form>
                ) : (
                    <div className="text-center">
                        <p className="text-gray-700 text-lg mb-6 dark:text-gray-300">이미 로그인되어 있습니다.</p>
                        <Link to="/" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline inline-block">
                            대시보드로 이동
                        </Link>
                    </div>
                )} 
                */}
                {/* ⭐️⭐️⭐️ 위 주석 처리된 부분을 아래처럼 간결하게 변경 ⭐️⭐️⭐️ */}
                {!isLoggedIn && ( // 로그인되어 있지 않을 때만 로그인 폼을 표시합니다.
                    <form onSubmit={handleLogin}>
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
                                disabled={isLoading}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                                비밀번호
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs italic mb-4 dark:text-red-300">{error}</p>}
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
                )} {/* isLoggedIn이 true일 때는 아무것도 렌더링하지 않고 useEffect가 리다이렉트 처리 */}

                <p className="text-center text-gray-600 text-sm mt-4 dark:text-gray-400">
                    계정이 없으신가요? <Link to="/register" className="text-blue-500 hover:underline dark:text-blue-400">회원가입</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;