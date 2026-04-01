plugins {
    id("com.netflix.dgs.codegen") version "8.3.0"
    kotlin("jvm") version "2.2.21"
    kotlin("plugin.spring") version "2.2.21"
    id("org.springframework.boot") version "4.0.3"
    id("io.spring.dependency-management") version "1.1.7"
    kotlin("plugin.jpa") version "2.2.21"
    id("com.google.devtools.ksp") version "2.1.21-2.0.1"
}

group = "ai.ssot"
version = "0.0.1-SNAPSHOT"
description = "context-api"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

extra["netflixDgsVersion"] = "11.0.0"

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-data-neo4j")
    implementation("org.springframework.boot:spring-boot-starter-data-redis")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("com.netflix.graphql.dgs:graphql-dgs-spring-graphql-starter")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("tools.jackson.module:jackson-module-kotlin")

    implementation("io.github.oshai:kotlin-logging-jvm:5.1.4")

    implementation("io.github.openfeign.querydsl:querydsl-jpa:7.0")
    ksp("io.github.openfeign.querydsl:querydsl-ksp-codegen:7.0")
    annotationProcessor("io.github.openfeign.querydsl:querydsl-apt:7.0:jakarta")

    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    implementation("io.jsonwebtoken:jjwt-impl:0.12.6")
    implementation("io.jsonwebtoken:jjwt-jackson:0.12.6")

    runtimeOnly("org.postgresql:postgresql")

    testImplementation(platform("org.testcontainers:testcontainers-bom:1.21.3"))
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
    testImplementation("org.springframework.boot:spring-boot-starter-data-neo4j-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
    testImplementation("com.netflix.graphql.dgs:graphql-dgs-spring-graphql-starter-test")
    testImplementation("io.kotest:kotest-runner-junit5:6.0.4")
    testImplementation("io.kotest:kotest-framework-engine:6.0.4")
    testImplementation("io.kotest:kotest-extensions-spring:6.0.4")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
    testImplementation("org.testcontainers:testcontainers")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

dependencyManagement {
    imports {
        mavenBom("com.netflix.graphql.dgs:graphql-dgs-platform-dependencies:${property("netflixDgsVersion")}")
    }
}

tasks.generateJava {
    schemaPaths = mutableListOf("${projectDir}/src/main/resources/schema")
    packageName = "ai.ssot.contextapi.generated"
    language = "java"
    generateClient = true
    typeMapping = mutableMapOf(
        "PageInfo" to "ai.ssot.contextapi.shared.page.PageInfo",
        "DateTime" to "java.time.LocalDateTime",
        "Long" to "java.lang.Long",
    )
}

kotlin {
    compilerOptions {
        freeCompilerArgs.addAll("-Xjsr305=strict", "-Xannotation-default-target=param-property")
    }
}

allOpen {
    annotation("jakarta.persistence.Entity")
    annotation("jakarta.persistence.MappedSuperclass")
    annotation("jakarta.persistence.Embeddable")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
