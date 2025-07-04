# 1단계: Maven 빌드
FROM maven:3.9.3-eclipse-temurin-17 AS build
WORKDIR /app

# 의존성 다운로드 캐시 활용
COPY pom.xml .
RUN mvn dependency:go-offline

# 소스 복사 후 빌드
COPY src ./src
RUN mvn package -DskipTests

# 2단계: 실행용 경량 이미지
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# 빌드 단계에서 생성된 jar 복사
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
