# 1단계: Frontend Build Stage
FROM node:20-alpine AS frontend
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
WORKDIR /repo

# Workspace manifests first (dep install caching)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/app-protocol/package.json packages/app-protocol/
COPY packages/app-sdk/package.json packages/app-sdk/
COPY packages/config-schema/package.json packages/config-schema/
COPY packages/design-tokens/package.json packages/design-tokens/
COPY packages/desktop-sdk/package.json packages/desktop-sdk/
COPY packages/shell-runtime/package.json packages/shell-runtime/
COPY packages/ui/package.json packages/ui/
COPY apps/desktop/package.json apps/desktop/
COPY apps/landing/package.json apps/landing/
COPY apps/issue_tracker/frontend/package.json apps/issue_tracker/frontend/

RUN pnpm install --filter "@dashway/issue-tracker..." --frozen-lockfile

# Sources for the frontend and its workspace deps
COPY packages/app-protocol packages/app-protocol
COPY packages/app-sdk packages/app-sdk
COPY packages/design-tokens packages/design-tokens
COPY apps/issue_tracker/frontend apps/issue_tracker/frontend

# design-tokens는 ./dist/index.js로 export하므로 사전 빌드 필요
RUN pnpm --filter @dashway/design-tokens build

RUN pnpm --filter @dashway/issue-tracker build

# 2단계: Backend Build Stage
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /home/gradle/project

COPY apps/issue_tracker/backend/gradlew .
COPY apps/issue_tracker/backend/gradle gradle
COPY apps/issue_tracker/backend/build.gradle.kts apps/issue_tracker/backend/settings.gradle.kts ./

RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

COPY apps/issue_tracker/backend/src src
COPY --from=frontend /repo/apps/issue_tracker/frontend/dist src/main/resources/static

RUN ./gradlew bootJar --no-daemon

# 3단계: Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /home/gradle/project/build/libs/*.jar app.jar

EXPOSE 12000

ENTRYPOINT ["java", "-jar", "app.jar"]
