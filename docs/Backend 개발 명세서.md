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
│   ├── controller/     # UserController, ChatController
│   ├── service/        # UserService, AuthService, ChatService, LangServeService
│   ├── repository/     # UserRepository, ChatMessageRepository
│   ├── entity/         # User, ChatMessage
│   ├── dto/            # UserDto, ChatMessageDto, LangServeResponseDto
│   ├── provider/       # JwtAuthenticationFilter, JwtProvider
│   ├── config/         # SecurityConfig, PasswordEncoderConfig, RedisConfig, WebConfig, WebClientConfig
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

# application-prod.properties
myprop.username=Prod Env

logging.level.com.miniproject.joongo=DEBUG

# 현재 DB는 테스트편의성을 위해 로컬 DB 사용 추후 계획된 DB로 변경 예정
spring.datasource.url=jdbc:mariadb://127.0.0.1:3306/AiCareerChatBot_db
spring.datasource.username=AiCareerChatBot
spring.datasource.password=AiCareerChatBot
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver

spring.jpa.hibernate.ddl-auto=update
  # JPA의 DDL 자동 생성 비활성화 (Flyway가 DDL을 관리)
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MariaDBDialect
spring.jpa.properties.hibernate.default_schema=AiCareerChatBot_db
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.show_sql=true

spring.sql.init.mode=never
  # 스프링 부트의 내장 SQL 초기화 기능 비활성화

spring.flyway.locations=classpath:db/migration
  # 마이그레이션 스크립트가 위치할 경로
spring.flyway.enabled=true
  # Flyway 활성화
spring.flyway.baseline-on-migrate=true
  # 기존 DB에 테이블이 있을 경우 Flyway가 현재 상태를 기준으로 베이스라인 설정
# spring.flyway.clean-disabled=false
# 프로덕션 환경에서는 비활성화 권장
# spring.flyway.schemas=AiCareerChatBot_db
# 특정 스키마에서 작업할 경우 (선택 사항, default-schema와 유사)

spring.data.redis.host=redis
spring.data.redis.port=6379

```



## 4. 주요 클래스

### 4.1 Entity
- **User**: 사용자 정보 (user_id, login_id, password, username, is_admin)
- **ChatMessage**: 채팅메시지 정보 (chat_id, user_id, sender, message, timestamp)

### 4.2 Controller
- **UserController**: `/auth` - 로그인/로그아웃, 회원가입, 토큰 갱신
- **ChatController**: `/chat` - 메시지 프론트/AI 간 상호 전달 및 저장, 채팅 내역 확인

### 4.3 Service
- **AuthService**: JWT 토큰 생성/검증, 사용자 인증
- **UserService**: 사용자 CRUD
- **ChatService**: 사용자 메시지 및 AI 응답 저장, 채팅 내역 확인
- **LangServeService**: 메시지 프론트/AI 간 상호 전달

### 4.4 Repository
- **UserRepository**: 사용자 데이터 액세스
- **ChatMessageRepository**: 채팅 데이터 액세스

## 5. 보안 구현

- **JWT 토큰 인증**: JwtAuthenticationFilter, JwtProvider
- **Spring Security 설정**: SecurityConfig (CORS, 권한 설정)
- **비밀번호 암호화**: PasswordEncoderConfig

## 6. AI 모듈 연동

- **WebClient 설정**: WebClientConfig에서 HTTP 클라이언트 구성
- **LangServe 클라이언트**: `/chat/invoke`, `/chat/history` 엔드포인트 호출
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