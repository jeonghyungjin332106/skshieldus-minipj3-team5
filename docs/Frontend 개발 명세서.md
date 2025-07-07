# Frontend 개발 명세서

## 1. 기술 스택

- **Framework**: React 18.2.0
- **언어**: TypeScript 5.0
- **상태 관리**: Redux Toolkit 2.0
- **스타일링**: Tailwind CSS 3.3
- **빌드**: Vite 5.0

## 2. 프로젝트 구조

```
frontend/
├── src/
│   ├── components/     # Header, Sidebar, ChatInterface, ContentUpload
│   │   ├── common/    # LoadingSpinner, ErrorBoundary
│   │   ├── auth/      # LoginForm, RegisterForm
│   │   ├── content/   # ContentList, ContentCard, FileUpload
│   │   └── chat/      # ChatMessage, ChatInput, TypingIndicator
│   ├── pages/         # HomePage, LoginPage, DashboardPage, ChatPage
│   ├── hooks/         # useAuth, useChat, useContent
│   ├── services/      # authService, chatService, contentService
│   ├── store/         # authSlice, chatSlice, contentSlice
│   └── utils/         # constants, helpers, apiClient
├── package.json
└── Dockerfile
```

## 3. 환경 설정

```env
# .env.development
REACT_APP_API_URL=http://localhost:8080/api/v1
REACT_APP_AI_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8080/ws

# .env.production
REACT_APP_API_URL=https://api.smartlearning.com/api/v1
REACT_APP_AI_URL=https://ai.smartlearning.com
```

## 4. 주요 페이지

| 페이지 | 컴포넌트 | 기능 |
|--------|----------|------|
| / | HomePage | 랜딩 페이지, 서비스 소개 |
| /login | LoginPage | 로그인 폼 |
| /register | RegisterPage | 회원가입 폼 |
| /dashboard | DashboardPage | 사용자 대시보드, 학습 진도 |
| /contents | ContentPage | 콘텐츠 목록, 업로드 관리 |
| /chat | ChatPage | AI 채팅 인터페이스 |

## 5. 컴포넌트

### 5.1 공통 컴포넌트
- **Header**: 네비게이션, 사용자 메뉴
- **Sidebar**: 메인 메뉴, 현재 페이지 표시
- **LoadingSpinner**: 로딩 상태 표시

### 5.2 채팅 컴포넌트
- **ChatInterface**: 메인 채팅 인터페이스
- **ChatMessage**: 개별 메시지 (사용자/AI)
- **ChatInput**: 메시지 입력창
- **TypingIndicator**: AI 응답 대기 표시

## 6. 상태 관리

```javascript
// Redux Store 구조
{
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false
  },
  content: {
    contents: [],
    selectedContent: null,
    loading: false,
    error: null
  },
  chat: {
    messages: [],
    currentSession: null,
    isLoading: false,
    isTyping: false
  }
}
```

### 주요 Slice
- **authSlice**: 로그인, 로그아웃, 토큰 관리
- **contentSlice**: 콘텐츠 목록, 업로드, 선택
- **chatSlice**: 메시지 관리, 채팅 세션

## 7. API 연동

- **Axios HTTP 클라이언트**: baseURL, 인터셉터 설정
- **authService**: 로그인, 회원가입, 토큰 갱신
- **contentService**: 파일 업로드, 목록 조회, 삭제
- **chatService**: 메시지 전송, 히스토리 조회, 피드백

## 8. 주요 기능

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **파일 업로드**: 드래그앤드롭, 진행률 표시
- **실시간 채팅**: WebSocket 또는 Server-Sent Events
- **로딩 상태 관리**: 각 API 호출별 로딩 표시

## 9. 빌드 및 배포

```json
{
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "test": "vitest",
    "preview": "vite preview"
  }
}
```

## 10. Docker 설정

```dockerfile
# 멀티스테이지 빌드
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```