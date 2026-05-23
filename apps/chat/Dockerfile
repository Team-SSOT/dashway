# syntax=docker/dockerfile:1.7

# 1단계: Frontend Build Stage (pnpm workspace)
FROM node:20-alpine AS frontend
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
WORKDIR /repo

# 빌드 컨텍스트는 레포 루트 (docker-compose 의 context: ../..)
COPY . .

RUN pnpm install --filter chat-frontend... --frozen-lockfile
ENV VITE_CHAT_DATA_SOURCE=live
RUN pnpm --filter chat-frontend build

# 2단계: Backend Build Stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /home/gradle/project

# Gradle 설정 파일을 먼저 복사 (의존성 캐싱을 위해)
COPY apps/chat/backend/gradlew .
COPY apps/chat/backend/gradle gradle
COPY apps/chat/backend/build.gradle.kts apps/chat/backend/settings.gradle.kts ./

RUN sed -i 's/\r$//' gradlew && chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

COPY apps/chat/backend/src src

# 프런트 빌드 산출물을 Spring Boot 정적 리소스 경로로 임베드
COPY --from=frontend /repo/apps/chat/frontend/dist src/main/resources/static

RUN ./gradlew bootJar --no-daemon

# 3단계: Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /home/gradle/project/build/libs/*.jar app.jar

EXPOSE 12001

ENTRYPOINT ["java", "-jar", "app.jar"]
