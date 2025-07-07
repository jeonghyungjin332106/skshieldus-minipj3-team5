// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { notifySuccess, notifyError } from '../components/Notification';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const BACKEND_API_BASE_URL = '/api';

function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const { isLoading, error, isLoggedIn } = useSelector((state) => state.auth); 
    const navigate = useNavigate();

    useEffect(() => {
        if (isLoggedIn) {
            navigate('/', { replace: true });
        }
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
                {!isLoggedIn && (
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
                )}

                <p className="text-center text-gray-600 text-sm mt-4 dark:text-gray-400">
                    계정이 없으신가요? <Link to="/signup" className="text-blue-500 hover:underline dark:text-blue-400">회원가입</Link> {/* ⭐️⭐️⭐️ /register -> /signup 변경 ⭐️⭐️⭐️ */}
                </p>
            </div>
        </div>
    );
}

export default LoginPage;