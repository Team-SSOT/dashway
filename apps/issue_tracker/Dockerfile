# 1단계: Frontend Build Stage
FROM node:20-alpine AS frontend
WORKDIR /web
COPY frontend/package.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# 2단계: Backend Build Stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /home/gradle/project

# Gradle 설정 파일들을 먼저 복사 (의존성 캐싱을 위해)
COPY backend/gradlew .
COPY backend/gradle gradle
COPY backend/build.gradle.kts backend/settings.gradle.kts ./

# gradlew 실행 권한 부여 및 의존성 미리 다운로드
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

# 소스 코드 복사
COPY backend/src src

# 프런트 빌드 산출물을 Spring Boot 정적 리소스 경로로 복사
COPY --from=frontend /web/dist src/main/resources/static

# plain jar가 생성되지 않도록 bootJar만 실행
RUN ./gradlew bootJar --no-daemon

# 3단계: Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /home/gradle/project/build/libs/*.jar app.jar

EXPOSE 12000

ENTRYPOINT ["java", "-jar", "app.jar"]
