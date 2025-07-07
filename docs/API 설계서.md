# API 설계서

## 1. 기본 정보

- **Base URL**: http://localhost:8080/api
- **인증 방식**: JWT Bearer Token

## 2. 공통 응답 형식

```json
{
  "success": true,
}
```

## 3. 인증 API

### 3.1 로그인
- **POST** `/auth/login`
```json
{
  "loginId": "testuser",
  "password": "testpass123!"
}
```
**응답:**
```json
{
    "success": true,
    "userId": 1,
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiVVNFUiIsInVzZXJOYW1lIjoi7YWM7Iqk7Yq47Jyg7KCAIiwic3ViIjoiMSIsImlhdCI6MTc1MTg1MTQ2NSwiZXhwIjoxNzUxODUzMjY1fQ.S4_L0YUQXTUwkgHRdxcjWup24CWcPMSfX9d7_8zDw-I",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzUxODUxNDY1LCJleHAiOjE3NTI0NTYyNjV9.XkZcZozEWf2OnMpJ3bt8-hFHbYfM0ZH8cZ3lMAbt5TU",
    "userName": "테스트유저"
}
```

### 3.2 회원가입
- **POST** `/auth/signup`
```json
{
  "loginId": "testuser",
  "password": "testpass123!",
  "userName": "테스트유저"
}
```

## 4. 콘텐츠 API

### 4.1 목록 조회
- **GET** `/contents?page=0&size=10&category=programming`

### 4.2 업로드
- **POST** `/contents/upload`
- **Content-Type**: multipart/form-data
- **Form Data**: 
  - file: 업로드할 파일 (PDF, DOCX, TXT)
  - title: 콘텐츠 제목
  - category: 카테고리 (선택)

### 4.3 상세 조회
- **GET** `/contents/{id}`

### 4.4 삭제
- **DELETE** `/contents/{id}`

## 5. AI 채팅 API

### 5.1 메시지 전송
- **POST** `/ai/chat`
```json
{
  "question": "Spring Boot의 주요 특징은 무엇인가요?",
  "contentId": 1,
  "useRag": true
}
```
**응답:**
```json
{
  "success": true,
  "data": {
    "answer": "Spring Boot의 주요 특징은...",
    "confidence": 0.85,
    "sources": [
      {
        "content": "Spring Boot는 자동 설정...",
        "metadata": {
          "page": 1,
          "title": "Spring Boot 가이드"
        }
      }
    ],
    "responseTimeMs": 2500
  }
}
```

### 5.2 히스토리 조회
- **GET** `/ai/chat/history?contentId=1&page=0&size=20`

### 5.3 피드백
- **POST** `/ai/chat/{chatId}/feedback`
```json
{
  "feedback": "HELPFUL"
}
```

## 6. 퀴즈 API

### 6.1 생성
- **POST** `/ai/quiz/generate`
```json
{
  "contentId": 1,
  "questionCount": 5,
  "difficulty": "MEDIUM"
}
```

### 6.2 목록 조회
- **GET** `/quiz?contentId=1`

## 7. 사용자 API

### 7.1 프로필 조회
- **GET** `/users/profile`

### 7.2 프로필 수정
- **PUT** `/users/profile`
```json
{
  "username": "수정된이름",
  "email": "updated@example.com"
}
```

## 8. HTTP 상태 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 500 | 서버 오류 |