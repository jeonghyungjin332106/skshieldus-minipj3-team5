# Backend 개발 명세서

## 1. 기술 스택

- **Framework**: Spring Boot 3.4.6
- **언어**: Java 17
- **데이터베이스**: MariaDB 10.11
- **빌드**: Maven 3.9.10

## 2. 프로젝트 구조

```
backend/
├── src/main/java/AiCareerChatBot.demo/
│   ├── controller/     # UserController
│   ├── service/        # UserService, AuthService
│   ├── repository/     # UserRepository
│   ├── entity/         # User
│   ├── dto/            # UserDto
│   ├── provider/       # JwtAuthenticationFilter, JwtProvider
│   ├── config/         # SecurityConfig, PasswordEncoderConfig, RedisConfig, WebConfig
│   └── exception/      # AuthenticationException, BusinessException, InvalidCredentialsException, LogoutException, ResourceNotFoundException, TokenValidationException, ErrorCode
│       └──advice/      # DefaultExceptionAdvice, ErrorObject
├── src/main/resources/
│   ├── application.properties
│   └── application-prod.properties
├── Dockerfile
└── pom.xml
```

## 3. 주요 설정

```yaml
# application.properties
spring.application.name=AiCareerChatBot
spring.profiles.active=prod

spring.data.redis.host=redis
spring.data.redis.port=6379

logging.file.path=logs

image.upload.dir=src/main/resources/images/


jwt.secret: ""
```



## 4. 주요 클래스

### 4.1 Entity
- **User**: 사용자 정보 (user_id, login_id, password, username, is_admin)

### 4.2 Controller
- **UserController**: `/api/auth` - 로그인/로그아웃, 회원가입, 토큰 갱신

### 4.3 Service
- **AuthService**: JWT 토큰 생성/검증, 사용자 인증
- **UserService**: 사용자 CRUD

### 4.4 Repository
- **UserRepository**: 사용자 데이터 액세스

## 5. 보안 구현

- **JWT 토큰 인증**: JwtAuthenticationFilter, JwtProvider
- **Spring Security 설정**: SecurityConfig (CORS, 권한 설정)
- **비밀번호 암호화**: PasswordEncoderConfig

## 6. AI 모듈 연동

- **RestTemplate 설정**: AIServiceConfig에서 HTTP 클라이언트 구성
- **LangServe 클라이언트**: `/qa/invoke`, `/rag/invoke` 엔드포인트 호출
- **에러 핸들링**: 타임아웃, 재시도, Fallback 응답

## 7. 파일 처리

- **MultipartFile 업로드**: ContentController에서 처리
- **파일 저장 관리**: 로컬 파일 시스템 또는 클라우드 스토리지
- **지원 형식**: PDF, DOCX, TXT (최대 50MB)

## 8. 예외 처리

- **DefaultExceptionAdvice**: 전역 예외 처리, 통일된 에러 응답
- **Custom Exception**: AuthenticationException, BusinessException, InvalidCredentialsException 등

## 9. 빌드 및 배포

- **Maven 빌드**: `mvn clean package`
- **Docker 설정**: Dockerfile, JAR 실행 환경
- **프로파일**: dev, staging, prod 환경별 설정