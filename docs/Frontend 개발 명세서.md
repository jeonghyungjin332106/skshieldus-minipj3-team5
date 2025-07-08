# Frontend 개발 명세서

## 1. 기술 스택

- **Framework**: React 18
- **언어**: JavaScript
- **상태 관리**: Redux Toolkit
- **스타일링**: Tailwind CSS
- **빌드**: Vite

## 2. 프로젝트 구조

```
frontend/
├── src/
│   ├── components/    # AnalysisResultsDisplay, ChatInput, ChatInterface, ChatWindow, ContentUpload, FeedbackButton, FeedbackModal, GeneratedQuestionsDisplay, Header, LoadingSpinner, Notification, QuestionGenerationControls,ResumeUploadSection
│   ├── pages/        # ChatbotPage, DashboardPage, InterviewQuestionsPage, LoginPage, RegisterPage, ResumeAnalysisPage, UserGuidePage
│   ├── features/     
│   │   ├── analysis/    # analysisSlice
│   │   ├── auth/    # authSlice
│   │   ├── chat/    # chatSlice
│   │   ├── interview/    # interviewSlice
│   │   ├── theme/    # themeSlice
│   ├── assets/       
│   ├── app/           
├── package.json
└── Dockerfile
```

## 3. 환경 설정

```env
#수정 예정
REACT_APP_API_URL=
REACT_APP_AI_URL=

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
| / | DashboardPage | 메인 대시보드 (채팅 페이지로 이동) |
| /login | LoginPage | 로그인 |
| /register | RegisterPage | 회원가입 |
| /guide | UserGuidePage | 사용자를 위한 서비스 사용 가이드 |
| /resume-analysis | ResumeAnalysisPage | 이력서 분석 채팅 페이지 |
| /interview-questions  | InterviewQuestionsPage | 면접 준비 채팅 페이지 |
| /chatbot | ChatbotPage | 이력서 업로드 및 AI 채팅 |

## 5. 컴포넌트

### 5.1 공통 컴포넌트
- **Header**: 사용자 인증 상태 (로그인/로그아웃), 다크 모드 설정, 주요 페이지 탐색 기능 제공
- **LoadingSpinner**: 로딩 상태 표시
- **Notification**: 성공, 오류, 정보, 경고 유형의 알림 표시

### 5.2 채팅 컴포넌트
- **ChatInterface**: 메인 채팅 인터페이스 (채팅 메세지 표시 및 사용자 질문 입력 및 제어 기능)
- **ChatWindow**: 채팅 메세지 목록 표시 및 AI 응답 대기 표시, 새 메세지 추가 시 자동으로 스크롤하는 챗봇 UI 제공
- **ChatInput**: 메세지 입력 창, 전송 및 초기화 버튼, 질문 예시 버튼을 포함한 질문 입력 기능
- **ContentUpload**: 사용자에게 PDF, word, txt 파일 업로드를 통해 이력서 내용 분석 시작 기능
- **ResumeUploadSection**: 이력서 파일 업로드 기능 및 고급 설정 (청크 크기,  AI 창의성) 제공
- **AnalysisResultDisplay**: 이력서 분석 결과 표시 및 결과가 없을 경우 안내 메세지 제공
- **GeneratedQuestionsDisplay**: 생성된 면접 질문 목록 로딩 및 오류 상태에 따른 표시, 피드백 요청 기능
- **QuestionGenerationControls**: 회사 이름, 면접 유형, 이력서 파일 첨부를 통해 면접 예상 질문 생성 UI 제공
- **FeedbackButton**: AI 답변에 대한 사용자 피드백 수집 및 중복 제출 방지, 피드백 전송 상태 표시
- **FeedbackModal**: 면접 질문에 대한 사용자 답변 입력 받고 AI 피드백 요청, 로딩/오류/실제 피드백 결과를 표시하는 UI 제공

## 6. 상태 관리

```javascript
// Redux Store 구조
{
  auth: {
    isLoggedIn: false,
    user: null,
    token: null,
    isLoading: false,
    error: null,
    isRegistering: false,
    registerError: null,
    registerSuccess: false,
    registeredUsers: []
  },
  chat: {
    messages: [],
    isAiTyping: false,
    error: null
  },
  analysis: {
    results: null,
    isLoading: false,
    error: null
  },
  interview: {
    generatedQuestions: null,
    isLoading: false,
    error: null
  },
  theme: {
    isDarkMode: false
  }
}
```

### 주요 Slice
- **authSlice**: 로그인, 로그아웃, 회원가입 및 관련 인증 상태 (토큰, 로딩, 오류) 관리
- **chatSlice**: 채팅 메세지 이력, AI 타이핑 상태, 채팅 오류 및 특정 질문에 대한 채팅 세션 관리
- **analysisSlice**: 문서 분석 결과 (로딩, 성공, 실패) 관리
- **interviewSlice**: 면접 예상 질문의 생성 과정 (로딩, 성공, 실패) 및 결과 관리
- **themeSlice**: 애플리케이션의 다크 모드 활성화 여부 관리 및 변경된 테마 선호도 저장

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