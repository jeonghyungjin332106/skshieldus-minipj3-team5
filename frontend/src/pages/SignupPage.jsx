// src/pages/SignupPage.jsx (수정 제안)
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    registerStart,
    registerSuccess,
    registerFailure,
    resetRegisterState,
    loginSuccess
} from '../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { notifySuccess, notifyError } from '../components/Notification';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

const BACKEND_API_BASE_URL = '/api';

function SignupPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userName, setUserName] = useState('');

    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [userNameError, setUserNameError] = useState('');

    const dispatch = useDispatch();
    // isLoggedIn 상태도 함께 가져옵니다.
    const { isRegistering, registerError, registerSuccess: isRegisterSuccess, isLoggedIn } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    /**
     * 회원가입 성공 및 로그인 상태 변화를 감지하여 페이지를 리디렉션합니다.
     */
    useEffect(() => {
        // Redux의 isLoggedIn 상태가 true로 바뀌면, 즉시 대시보드로 이동
        if (isLoggedIn) {
            console.log("SignupPage useEffect: 로그인 상태 true 감지, 대시보드로 이동합니다.");
            navigate('/dashboard', { replace: true }); // 대시보드로 직접 리디렉션
            // 여기서 resetRegisterState()를 호출하면 loginSuccess 이후 상태가 리셋되어 문제가 될 수 있으니
            // 로그인 성공 시에는 resetRegisterState()를 호출하지 않습니다.
            // 대신, 회원가입만 성공하고 자동 로그인되지 않은 경우에만 resetRegisterState()를 호출합니다.
            return; 
        }

        // 회원가입만 성공하고 자동 로그인되지 않은 경우 (isLoggedIn이 false이고 isRegisterSuccess가 true)
        if (isRegisterSuccess) {
            console.log("SignupPage useEffect: 회원가입 성공 감지 (자동 로그인 아님), 로그인 페이지로 이동합니다.");
            notifySuccess('회원가입이 성공적으로 완료되었습니다! 로그인 해주세요.', {
                position: "top-center",
                autoClose: 3000,
            });
            dispatch(resetRegisterState()); // 이 경우에만 상태 초기화
            navigate('/login'); // 로그인 페이지로 이동
        }
    }, [isLoggedIn, isRegisterSuccess, dispatch, navigate]); // isLoggedIn을 의존성 배열에 추가

    // ... (validateField 함수는 동일) ...
    const validateField = (fieldName, value, otherValue = null) => {
        let error = '';
        switch (fieldName) {
            case 'username':
                if (!value.trim()) error = '아이디를 입력해주세요.';
                setUsernameError(error);
                break;
            case 'userName':
                if (!value.trim()) error = '이름을 입력해주세요.';
                setUserNameError(error);
                break;
            case 'password':
                const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
                if (!value) {
                    error = '비밀번호를 입력해주세요.';
                } else if (!passwordRegex.test(value)) {
                    error = '비밀번호는 영문, 숫자, 특수문자를 각 1개 이상 포함하고 8자 이상이어야 합니다.';
                }
                setPasswordError(error);
                if (confirmPassword && value !== confirmPassword) {
                    setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
                } else if (confirmPassword) {
                    setConfirmPasswordError('');
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    error = '비밀번호 확인을 입력해주세요.';
                } else if (value !== otherValue) {
                    error = '비밀번호가 일치하지 않습니다.';
                }
                setConfirmPasswordError(error);
                break;
            default:
                break;
        }
        return error;
    };


    const handleRegister = async (e) => {
        e.preventDefault();

        const usernameErrorMsg = validateField('username', username);
        const userNameErrorMsg = validateField('userName', userName);
        const passwordErrorMsg = validateField('password', password);
        const confirmPasswordErrorMsg = validateField('confirmPassword', confirmPassword, password);

        const isFormValid = !usernameErrorMsg && !userNameErrorMsg && !passwordErrorMsg && !confirmPasswordErrorMsg;

        if (!isFormValid) {
            notifyError('입력 정보를 다시 확인해주세요.');
            return;
        }

        dispatch(registerStart());

        try {
            const response = await axios.post(
                `${BACKEND_API_BASE_URL}/auth/signup`,
                { loginId: username, password: password, userName: userName },
                { timeout: 10000 }
            );

            if (response.status === 200 || response.status === 201) {
                const { token, user } = response.data;
                if (token && user) {
                    dispatch(loginSuccess({ user: user, token: token }));
                    notifySuccess(`회원가입 성공 및 자동 로그인! 환영합니다, ${user.userName || user.loginId || '새 사용자'}님!`);
                    // 이 시점에서 isLoggedIn이 true가 되어 위 useEffect가 트리거되고 대시보드로 리디렉션될 것입니다.
                    // 따라서 여기서 navigate('/dashboard')를 직접 호출할 필요가 없습니다.
                } else {
                    dispatch(registerSuccess()); // 자동 로그인 안 된 경우
                }
            } else {
                const errorMessage = response.data?.message || `회원가입 실패: ${response.status} ${response.statusText}`;
                dispatch(registerFailure(errorMessage));
                notifyError(errorMessage);
            }
        } catch (err) {
            console.error("회원가입 중 오류 발생:", err.response ? err.response.data : err.message);

            let errorMessage = '회원가입 중 알 수 없는 오류가 발생했습니다.';

            if (axios.isAxiosError(err) && err.response) {
                if (err.response.status === 409) {
                    errorMessage = err.response.data?.message || '이미 존재하는 아이디입니다. 다른 아이디를 사용해주세요.';
                } else if (err.response.status === 400) {
                    errorMessage = err.response.data?.message || '입력값이 올바르지 않습니다. 다시 확인해주세요.';
                } else if (err.response.status >= 500) {
                    errorMessage = '서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
                } else {
                    errorMessage = err.response.data?.message || `요청 처리 중 오류가 발생했습니다. (코드: ${err.response.status})`;
                }
            } else if (axios.isAxiosError(err) && err.request) {
                errorMessage = '서버에 연결할 수 없습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.';
            } else {
                errorMessage = err.message || '회원가입 요청을 보내는 중 오류가 발생했습니다.';
            }

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
                    {/* 아이디 입력 필드 섹션 */}
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                            아이디
                        </label>
                        <input
                            type="text"
                            id="username"
                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline
                                        dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100
                                        ${usernameError ? 'border-red-500' : 'border-gray-300'}`}
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                validateField('username', e.target.value);
                            }}
                            disabled={isRegistering}
                            required
                            aria-invalid={!!usernameError}
                            aria-describedby="username-error"
                        />
                        {usernameError && <p id="username-error" className="text-red-500 text-xs italic mt-1 dark:text-red-300">{usernameError}</p>}
                    </div>

                    {/* 이름 입력 필드 섹션 */}
                    <div className="mb-4">
                        <label htmlFor="userName" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                            이름
                        </label>
                        <input
                            type="text"
                            id="userName"
                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline
                                        dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100
                                        ${userNameError ? 'border-red-500' : 'border-gray-300'}`}
                            value={userName}
                            onChange={(e) => {
                                setUserName(e.target.value);
                                validateField('userName', e.target.value);
                            }}
                            disabled={isRegistering}
                            required
                            aria-invalid={!!userNameError}
                            aria-describedby="userName-error"
                        />
                        {userNameError && <p id="userName-error" className="text-red-500 text-xs italic mt-1 dark:text-red-300">{userNameError}</p>}
                    </div>

                    {/* 비밀번호 입력 필드 섹션 */}
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            id="password"
                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline
                                        dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100
                                        ${passwordError ? 'border-red-500' : 'border-gray-300'}`}
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                validateField('password', e.target.value);
                            }}
                            disabled={isRegistering}
                            required
                            aria-invalid={!!passwordError}
                            aria-describedby="password-error"
                        />
                        {passwordError && <p id="password-error" className="text-red-500 text-xs italic mt-1 dark:text-red-300">{passwordError}</p>}
                    </div>

                    {/* 비밀번호 확인 입력 필드 섹션 */}
                    <div className="mb-6">
                        <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">
                            비밀번호 확인
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline
                                        dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100
                                        ${confirmPasswordError ? 'border-red-500' : 'border-gray-300'}`}
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                validateField('confirmPassword', e.target.value, password);
                            }}
                            disabled={isRegistering}
                            required
                            aria-invalid={!!confirmPasswordError}
                            aria-describedby="confirmPassword-error"
                        />
                        {confirmPasswordError && <p id="confirmPassword-error" className="text-red-500 text-xs italic mt-1 dark:text-red-300">{confirmPasswordError}</p>}
                    </div>

                    {/* 서버로부터 받은 회원가입 에러 (Redux 상태) */}
                    {registerError && (
                        <p className="text-red-500 text-xs italic mb-4 dark:text-red-300">
                            {registerError}
                        </p>
                    )}

                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                            disabled={isRegistering} // 로딩 중 버튼 비활성화
                        >
                            {/* 회원가입 진행 중일 때 로딩 스피너 및 메시지 표시 */}
                            {isRegistering ? (
                                <span className="flex items-center justify-center">
                                    <LoadingSpinner size="sm" color="white" /> {/* 버튼 내부에 적합한 작은 흰색 스피너 */}
                                    <span className="ml-2">회원가입 중...</span>
                                </span>
                            ) : (
                                '회원가입' // 일반 상태일 때 버튼 텍스트
                            )}
                        </button>
                    </div>
                </form>
                {/* 이미 계정이 있는 사용자를 위한 로그인 링크 */}
                <p className="text-center text-gray-600 text-sm mt-4 dark:text-gray-400">
                    이미 계정이 있으신가요? <Link to="/login" className="text-blue-500 hover:underline dark:text-blue-400">로그인</Link>
                </p>
            </div>
        </div>
    );
}

export default SignupPage;