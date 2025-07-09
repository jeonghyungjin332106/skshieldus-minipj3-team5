// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // 전역 CSS 스타일 임포트
import { Provider } from 'react-redux'; // Redux 스토어를 애플리케이션에 제공하기 위한 Provider 임포트
import { store } from './app/store.js'; // Redux 스토어 임포트

/**
 * React 애플리케이션의 진입점 파일입니다.
 * 이 파일은 애플리케이션을 DOM에 렌더링하고, Redux 스토어를 연결합니다.
 */

// 'root' ID를 가진 DOM 요소를 찾아 React 애플리케이션을 렌더링할 루트로 지정합니다.
ReactDOM.createRoot(document.getElementById('root')).render(
    // React.StrictMode: 개발 모드에서 잠재적인 문제를 감지하기 위한 도구입니다.
    // 애플리케이션의 컴포넌트 내에서 문제가 될 수 있는 패턴을 식별하고 경고를 표시합니다.
    <React.StrictMode>
        {/*
         * Provider 컴포넌트: Redux 스토어를 React 컴포넌트 트리에 제공합니다.
         * 이렇게 하면 모든 하위 컴포넌트에서 `useSelector` 및 `useDispatch` 훅을 사용하여
         * Redux 스토어의 상태에 접근하고 액션을 디스패치할 수 있습니다.
         */}
        <Provider store={store}>
            {/* 애플리케이션의 최상위 컴포넌트인 App을 렌더링합니다. */}
            <App />
        </Provider>
    </React.StrictMode>,
);