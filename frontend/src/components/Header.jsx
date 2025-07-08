// src/components/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { toggleDarkMode } from '../features/theme/themeSlice'; // themeSlice가 없다면 임포트 제거
import { notifySuccess } from './Notification'; // notificationService.js에서 임포트된 notifySuccess와 일치하는지 확인 필요

/**
 * 애플리케이션의 전역 헤더 컴포넌트입니다.
 * 로그인/로그아웃 상태, 다크 모드 토글, 주요 페이지 링크를 제공합니다.
 */
function Header() {
    // Redux 스토어에서 인증 및 테마 상태를 가져옵니다.
    const { isLoggedIn, user } = useSelector((state) => state.auth);
    // themeSlice가 없다면, 아래 isDarkMode 관련된 줄들을 제거해야 합니다.
    const { isDarkMode } = useSelector((state) => state.theme);
    const dispatch = useDispatch();
    const navigate = useNavigate(); // Link 외의 다른 프로그래밍 방식 라우팅을 위해 유지

    /**
     * 로그아웃 버튼 클릭 핸들러입니다.
     * Redux 상태를 업데이트하고 로그아웃 성공 알림을 표시합니다.
     * 로그인 페이지로의 리디렉션은 PrivateRoute에서 처리됩니다.
     */
    const handleLogout = () => {
        dispatch(logout()); // Redux 상태를 로그아웃으로 변경 (isLoggedIn: false, user: null, token: null)

        // 로그아웃 성공 알림을 사용자에게 즉시 표시합니다.
        notifySuccess('로그아웃 되었습니다.', {
            position: 'top-center',
            autoClose: 1500,
        });

        // App.jsx의 PrivateRoute가 인증 상태 변경에 따라 페이지 전환을 담당하므로
        // 여기서 navigate('/login') 호출이나 setTimeout은 필요 없습니다.
    };

    /**
     * 다크 모드 토글 버튼 클릭 핸들러입니다.
     * Redux 상태를 업데이트하여 다크 모드를 전환합니다.
     */
    const handleToggleDarkMode = () => {
        dispatch(toggleDarkMode());
    };

    return (
        <header
            className="bg-gray-800 text-white p-4 flex justify-between items-center
                       dark:bg-gray-900 dark:text-gray-100"
        >
            <div className="flex items-center">
                {/* 홈/대시보드 링크 */}
                <Link to="/" className="text-xl font-bold dark:text-gray-50">
                    AI 커리어 챗봇
                </Link>
                {/* 로그인 상태일 때만 대시보드 링크 표시 */}
                {isLoggedIn && (
                    <Link
                        to="/"
                        className="ml-4 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700
                                   dark:bg-blue-700 dark:hover:bg-blue-800"
                    >
                        대시보드
                    </Link>
                )}
            </div>
            <nav className="flex items-center space-x-4">
                {/* 다크 모드 토글 버튼 */}
                <button
                    onClick={handleToggleDarkMode}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors duration-200
                               focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800"
                    aria-label={isDarkMode ? '라이트 모드 전환' : '다크 모드 전환'}
                >
                    {isDarkMode ? (
                        // 다크 모드일 때 달 아이콘
                        <svg className="w-6 h-6 text-yellow-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                        </svg>
                    ) : (
                        // 라이트 모드일 때 해 아이콘
                        <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.456 4.63A9.993 9.993 0 0110 18a9.993 9.993 0 01-3.544-.63l-.612.612a1 1 0 01-1.414-1.414l.612-.612A9.993 9.993 0 012 10c0-4.478 3.588-8.1 8-8.1s8 3.622 8 8.1c0 2.222-.9 4.242-2.344 5.63l.612.612a1 1 0 010 1.414l-1.414 1.414a1 1 0 01-1.414 0zM10 0a10 10 0 100 20A10 10 0 0010 0z" clipRule="evenodd"></path>
                        </svg>
                    )}
                </button>

                {/* 사용 가이드 링크 */}
                <Link
                    to="/guide"
                    className="px-3 py-1 rounded hover:bg-gray-700 transition-colors duration-200
                               dark:hover:bg-gray-800"
                >
                    사용 가이드
                </Link>
                {/* 로그인 상태에 따라 로그인/로그아웃 버튼 표시 */}
                {isLoggedIn ? (
                    <div className="flex items-center">
                        <span className="mr-4 dark:text-gray-300">
                            환영합니다, {user?.userName || user?.loginId || '사용자'}님!
                        </span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700
                                       dark:bg-red-700 dark:hover:bg-red-800"
                        >
                            로그아웃
                        </button>
                    </div>
                ) : (
                    <Link
                        to="/login"
                        className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700
                                   dark:bg-blue-700 dark:hover:bg-blue-800"
                    >
                        로그인
                    </Link>
                )}
            </nav>
        </header>
    );
}

export default Header;