package ai.ssot.contextapi.config.runtime

import org.springframework.boot.EnvironmentPostProcessor
import org.springframework.boot.SpringApplication
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor
import org.springframework.core.Ordered
import org.springframework.core.env.ConfigurableEnvironment
import org.springframework.core.env.MapPropertySource
import org.springframework.core.env.StandardEnvironment
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.nio.file.Files
import java.nio.file.Path

class DashwayConfigDataSourceEnvironmentPostProcessor : EnvironmentPostProcessor, Ordered {
    override fun getOrder(): Int = ConfigDataEnvironmentPostProcessor.ORDER + 1

    override fun postProcessEnvironment(
        environment: ConfigurableEnvironment,
        application: SpringApplication,
    ) {
        val configPath = environment.getProperty("dashway.config.path")
            ?.trim()
            ?.takeIf { it.isNotEmpty() }
            ?: return

        val postgres = readPostgresConfig(Path.of(configPath))
        val properties = mapOf(
            "spring.datasource.url" to postgres.jdbcUrl(),
            "spring.datasource.username" to postgres.username,
            "spring.datasource.password" to postgres.password,
        )

        val propertySource = MapPropertySource(PROPERTY_SOURCE_NAME, properties)
        val propertySources = environment.propertySources
        if (propertySources.contains(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME)) {
            propertySources.addAfter(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, propertySource)
        } else {
            propertySources.addFirst(propertySource)
        }
    }

    private fun readPostgresConfig(configPath: Path): PostgresConfig {
        if (!Files.isRegularFile(configPath)) {
            throw IllegalStateException("Dashway config file does not exist: $configPath")
        }

        val root = ObjectMapper().readTree(Files.readString(configPath))
        val schemaVersion = root.requiredInt("schemaVersion", "schemaVersion")
        if (schemaVersion != 1) {
            throw IllegalStateException("Unsupported dashway config schema version: $schemaVersion")
        }

        val postgres = root.requiredObject("database", "database")
            .requiredObject("postgres", "database.postgres")
        val databases = postgres.requiredObject("databases", "database.postgres.databases")

        return PostgresConfig(
            host = postgres.requiredText("host", "database.postgres.host"),
            port = postgres.requiredPositiveInt("port", "database.postgres.port"),
            username = postgres.requiredText("username", "database.postgres.username"),
            password = postgres.requiredText("password", "database.postgres.password"),
            database = databases.requiredText(DATABASE_KEY, "database.postgres.databases.$DATABASE_KEY"),
        )
    }

    private fun JsonNode.requiredObject(field: String, path: String): JsonNode {
        val fieldNode = get(field)
            ?: throw IllegalStateException("Dashway config $path must be an object.")
        if (!fieldNode.isObject) {
            throw IllegalStateException("Dashway config $path must be an object.")
        }
        return fieldNode
    }

    private fun JsonNode.requiredText(field: String, path: String): String {
        val fieldNode = get(field)
            ?: throw IllegalStateException("Dashway config $path must not be blank.")
        val value = fieldNode.asString().trim()
        if (value.isBlank()) {
            throw IllegalStateException("Dashway config $path must not be blank.")
        }
        return value
    }

    private fun JsonNode.requiredInt(field: String, path: String): Int {
        val fieldNode = get(field)
            ?: throw IllegalStateException("Dashway config $path must be an integer.")
        return fieldNode.asString().trim().toIntOrNull()
            ?: throw IllegalStateException("Dashway config $path must be an integer.")
    }

    private fun JsonNode.requiredPositiveInt(field: String, path: String): Int {
        val value = requiredInt(field, path)
        if (value <= 0) {
            throw IllegalStateException("Dashway config $path must be a positive integer.")
        }
        return value
    }

    private data class PostgresConfig(
        val host: String,
        val port: Int,
        val username: String,
        val password: String,
        val database: String,
    ) {
        fun jdbcUrl(): String = "jdbc:postgresql://$host:$port/$database"
    }

    private companion object {
        const val DATABASE_KEY = "contextApi"
        const val PROPERTY_SOURCE_NAME = "dashwayConfigDataSource"
    }
}
