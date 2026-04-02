FROM eclipse-temurin:21-jdk AS build

WORKDIR /workspace

COPY gradlew ./
COPY gradle ./gradle
COPY settings.gradle.kts build.gradle.kts ./
COPY src ./src

RUN chmod +x gradlew
RUN ./gradlew --no-daemon bootJar
RUN JAR_PATH="$(find build/libs -maxdepth 1 -type f -name '*.jar' ! -name '*-plain.jar' | head -n 1)" \
    && test -n "${JAR_PATH}" \
    && cp "${JAR_PATH}" /workspace/app.jar

FROM eclipse-temurin:21-jre AS runtime

WORKDIR /app

COPY --from=build /workspace/app.jar ./app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
