// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { notifySuccess, notifyError } from '../components/Notification';
import axios from 'axios'; // API 호출을 위한 axios 임포트
import LoadingSpinner from '../components/LoadingSpinner'; // 로딩 스피너 컴포넌트 임포트

// 백엔드 API 기본 URL 설정
const BACKEND_API_BASE_URL = '/api';

/**
 * 사용자 로그인 페이지 컴포넌트입니다.
 * 사용자 ID와 비밀번호를 입력받아 로그인 요청을 처리하고, 인증 상태에 따라 페이지를 리디렉션합니다.
 */
function LoginPage() {
    // 사용자 입력 상태 관리
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // 개별 필드별 유효성 검사 에러 메시지 상태 추가
    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Redux 훅을 사용하여 dispatch 함수와 인증 상태를 가져옵니다.
    const dispatch = useDispatch();
    const { isLoading, error, isLoggedIn } = useSelector((state) => state.auth);
    const navigate = useNavigate(); // 페이지 이동을 위한 훅

    /**
     * `isLoggedIn` 상태가 변경될 때마다 실행됩니다.
     * 사용자가 로그인되면 대시보드 페이지로 리디렉션합니다.
     */
    useEffect(() => {
        if (isLoggedIn) {
            navigate('/', { replace: true }); // 로그인 성공 시 대시보드 페이지로 이동하며 이전 기록 대체
        }
    }, [isLoggedIn, navigate]); // isLoggedIn과 navigate가 변경될 때만 실행

    /**
     * 개별 입력 필드의 유효성을 검사하고 해당 필드의 에러 상태를 업데이트합니다.
     * @param {string} fieldName - 유효성을 검사할 필드의 이름 ('username', 'password')
     * @param {string} value - 현재 필드의 입력 값
     * @returns {string} 해당 필드의 에러 메시지 (오류가 없으면 빈 문자열 반환)
     */
    const validateField = (fieldName, value) => {
        let error = ''; // 초기 에러 메시지는 없음

        switch (fieldName) {
            case 'username':
                if (!value.trim()) {
                    error = '아이디를 입력해주세요.';
                }
                setUsernameError(error); // 해당 필드의 에러 상태 업데이트
                break;
            case 'password':
                if (!value) {
                    error = '비밀번호를 입력해주세요.';
                }
                // TODO: 비밀번호 최소 길이 등 추가 유효성 검사 필요 시 여기에 추가
                setPasswordError(error);
                break;
            default:
                break;
        }
        return error; // 현재 필드의 에러 메시지 반환 (제출 시 최종 검사에 사용)
    };

    /**
     * 로그인 폼 제출 핸들러입니다.
     * 사용자 ID와 비밀번호를 사용하여 백엔드에 로그인 요청을 보냅니다.
     * @param {React.FormEvent} e - 폼 제출 이벤트 객체
     */
    const handleLogin = async (e) => {
        e.preventDefault(); // 기본 폼 제출 동작 방지

        // 폼 제출 시 모든 필드에 대한 최종 유효성 검사를 수행하고 에러 상태를 업데이트합니다.
        const usernameErrorMsg = validateField('username', username);
        const passwordErrorMsg = validateField('password', password);

        // 모든 필드가 유효한지 확인합니다. (에러 메시지가 없으면 유효)
        const isFormValid = !usernameErrorMsg && !passwordErrorMsg;

        // 폼 유효성 검사에 실패하면 API 요청을 보내지 않고 함수를 종료합니다.
        if (!isFormValid) {
            notifyError('아이디와 비밀번호를 모두 입력해주세요.'); // 사용자에게 전반적인 오류 알림
            // Redux의 `error` 상태는 주로 서버 측 에러를 위해 남겨두고,
            // 클라이언트 측 폼 유효성 에러는 개별 필드 에러 상태로 관리하여 메시지 중복을 피합니다.
            return;
        }

        dispatch(loginStart()); // 로그인 시작 Redux 액션 디스패치 (로딩 상태 활성화)

        try {
            // 백엔드 로그인 API 호출
            const response = await axios.post(
                `${BACKEND_API_BASE_URL}/auth/login`,
                {
                    loginId: username,
                    password: password,
                },
                {
                    timeout: 10000, // 10초 타임아웃 설정
                }
            );

            // API 응답에서 필요한 데이터 추출
            const { accessToken, userName, userId } = response.data;

            // Redux 스토어에 저장할 사용자 정보 객체 생성
            const user = {
                userId: userId,
                userName: userName,
                loginId: username,
            };

            dispatch(loginSuccess({ user: user, token: accessToken })); // 로그인 성공 액션 디스패치
            notifySuccess(`로그인 성공! 환영합니다, ${userName}님!`); // 성공 알림 표시

        } catch (err) {
            // 로그인 실패 시 에러 처리
            console.error('로그인 중 오류 발생:', err.response ? err.response.data : err.message);

            let errorMessage = '로그인 중 알 수 없는 오류가 발생했습니다.'; // 기본 오류 메시지

            if (axios.isAxiosError(err) && err.response) { // Axios 에러이고 서버 응답이 있을 경우
                if (err.response.status === 401) { // HTTP 401 Unauthorized (인증 실패) - 아이디/비밀번호 불일치
                    errorMessage = err.response.data?.message || '아이디 또는 비밀번호가 올바르지 않습니다.';
                } else if (err.response.status === 404) { // HTTP 404 Not Found - 사용자 없음 등 (백엔드 구현에 따라 다름)
                    errorMessage = err.response.data?.message || '등록되지 않은 아이디입니다.';
                } else if (err.response.status === 400) { // HTTP 400 Bad Request - 유효하지 않은 요청 데이터 등
                    errorMessage = err.response.data?.message || '잘못된 로그인 요청입니다. 입력값을 확인해주세요.';
                } else if (err.response.status >= 500) { // HTTP 5xx (서버 내부 오류)
                    errorMessage = '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
                } else { // 그 외 4xx 오류
                    errorMessage = err.response.data?.message || `요청 처리 중 오류가 발생했습니다. (코드: ${err.response.status})`;
                }
            } else if (axios.isAxiosError(err) && err.request) {
                // 요청은 보내졌지만 응답을 받지 못한 경우 (네트워크 오류, 서버 다운 등)
                errorMessage = '서버에 연결할 수 없습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.';
            } else {
                // 요청 설정 중 문제 발생 또는 Axios 에러가 아닌 다른 종류의 에러
                errorMessage = err.message || '로그인 요청을 보내는 중 오류가 발생했습니다.';
            }

            dispatch(loginFailure(errorMessage)); // 로그인 실패 액션 디스패치
            notifyError(errorMessage); // 사용자에게 에러 알림
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-gray-100
                       dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm dark:bg-gray-700">
                <h2 className="text-2xl font-bold text-center mb-6 dark:text-gray-50">
                    로그인
                </h2>
                {/* 이미 로그인된 상태가 아닐 때만 로그인 폼을 렌더링 */}
                {!isLoggedIn && (
                    <form onSubmit={handleLogin}>
                        {/* 아이디 입력 필드 섹션 */}
                        <div className="mb-4">
                            <label
                                htmlFor="username"
                                className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300"
                            >
                                아이디
                            </label>
                            <input
                                type="text"
                                id="username"
                                // 유효성 검사 실패 시 빨간색 테두리, 성공 시 기본 회색 테두리 적용
                                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline
                                            dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100
                                            ${usernameError ? 'border-red-500' : 'border-gray-300'}`}
                                value={username}
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    validateField('username', e.target.value); // 실시간 유효성 검사
                                }}
                                disabled={isLoading} // 로딩 중 비활성화
                                required // 필수 입력 필드
                                aria-invalid={!!usernameError} // 에러가 있을 경우 접근성 속성 추가
                                aria-describedby="username-error" // 에러 메시지와 연결 (선택 사항)
                            />
                            {/* 아이디 유효성 검사 에러 메시지 표시 */}
                            {usernameError && (
                                <p id="username-error" className="text-red-500 text-xs italic mt-1 dark:text-red-300">
                                    {usernameError}
                                </p>
                            )}
                        </div>
                        {/* 비밀번호 입력 필드 섹션 */}
                        <div className="mb-6">
                            <label
                                htmlFor="password"
                                className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300"
                            >
                                비밀번호
                            </label>
                            <input
                                type="password"
                                id="password"
                                // 유효성 검사 실패 시 빨간 테두리, 성공 시 기본 회색 테두리 적용
                                className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline
                                            dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100
                                            ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    validateField('password', e.target.value); // 실시간 유효성 검사
                                }}
                                disabled={isLoading} // 로딩 중 비활성화
                                required // 필수 입력 필드
                                aria-invalid={!!passwordError}
                                aria-describedby="password-error"
                            />
                            {/* 비밀번호 유효성 검사 에러 메시지 표시 */}
                            {passwordError && (
                                <p id="password-error" className="text-red-500 text-xs italic mt-1 dark:text-red-300">
                                    {passwordError}
                                </p>
                            )}
                        </div>
                        {/* 서버로부터 받은 로그인 에러 (Redux 상태) */}
                        {error && (
                            <p className="text-red-500 text-xs italic mb-4 dark:text-red-300">
                                {error}
                            </p>
                        )}
                        <div className="flex items-center justify-between">
                            {/* 로그인 제출 버튼 */}
                            <button
                                type="submit"
                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded
                                           focus:outline-none focus:shadow-outline w-full"
                                disabled={isLoading} // 로딩 중 비활성화
                            >
                                {/* 로그인 진행 중일 때 로딩 스피너 및 메시지 표시 */}
                                {isLoading ? (
                                    <span className="flex items-center justify-center">
                                        <LoadingSpinner size="sm" color="white" /> {/* 버튼 내부에 적합한 작은 흰색 스피너 */}
                                        <span className="ml-2">로그인 중...</span>
                                    </span>
                                ) : (
                                    '로그인' // 일반 상태일 때 버튼 텍스트
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* 회원가입 링크 */}
                <p className="text-center text-gray-600 text-sm mt-4 dark:text-gray-400">
                    계정이 없으신가요?{' '}
                    <Link to="/signup" className="text-blue-500 hover:underline dark:text-blue-400">
                        회원가입
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;