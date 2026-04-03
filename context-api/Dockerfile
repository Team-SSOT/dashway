# 1단계: Build Stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /home/gradle/project

# Gradle 설정 파일들을 먼저 복사 (의존성 캐싱을 위해)
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts ./

# gradlew 실행 권한 부여 및 의존성 미리 다운로드
RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

# 소스 코드 복사 및 JAR 빌드
COPY src src
# plain jar가 생성되지 않도록 bootJar만 실행
RUN ./gradlew bootJar --no-daemon

# 2단계: Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Build Stage에서 생성된 JAR 파일 복사
# Kotlin DSL의 경우 보통 build/libs/ 폴더에 생성됩니다.
COPY --from=build /home/gradle/project/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
