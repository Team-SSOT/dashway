package ai.ssot.contextapi.domain.app.service

import ai.ssot.contextapi.domain.app.entity.App
import ai.ssot.contextapi.domain.app.repository.AppRepository
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.nio.file.Files
import java.nio.file.Path

private val logger = KotlinLogging.logger {}

@ConfigurationProperties(prefix = "dashway.config")
data class DashwayConfigProperties(
    val path: String = "",
)

data class AppCatalogConfigEntry(
    val name: String,
    val port: Int,
)

data class AppCatalogSyncResult(
    val insertedCount: Int,
    val updatedCount: Int,
)

@Component
class DashwayConfigAppCatalogReader(
    private val objectMapper: ObjectMapper,
) {
    fun read(configPath: Path): List<AppCatalogConfigEntry> {
        if (!Files.isRegularFile(configPath)) {
            throw IllegalStateException("Dashway config file does not exist: $configPath")
        }

        val root = objectMapper.readTree(Files.readString(configPath))
        val schemaVersion = root.requiredInt("schemaVersion", "schemaVersion")
        if (schemaVersion != 1) {
            throw IllegalStateException("Unsupported dashway config schema version: $schemaVersion")
        }

        val appsNode = root.get("apps")
            ?: throw IllegalStateException("Dashway config apps must be an array.")
        if (!appsNode.isArray) {
            throw IllegalStateException("Dashway config apps must be an array.")
        }

        val entries = appsNode.mapIndexed { index, appNode ->
            val path = "apps[$index]"
            AppCatalogConfigEntry(
                name = appNode.requiredText("name", "$path.name"),
                port = appNode.requiredPositiveInt("port", "$path.port"),
            )
        }

        val duplicateNames = entries.groupingBy { it.name }.eachCount()
            .filterValues { count -> count > 1 }
            .keys
        if (duplicateNames.isNotEmpty()) {
            throw IllegalStateException(
                "Dashway config apps contain duplicate names: ${duplicateNames.joinToString(", ")}.",
            )
        }

        return entries
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
}

@Service
class AppCatalogSyncService(
    private val appRepository: AppRepository,
) {
    @Transactional
    fun sync(entries: List<AppCatalogConfigEntry>): AppCatalogSyncResult {
        var insertedCount = 0
        var updatedCount = 0

        entries.forEach { entry ->
            val existingApps = appRepository.findAllByName(entry.name)
            if (existingApps.size > 1) {
                throw IllegalStateException(
                    "App catalog sync cannot update duplicate DB apps named ${entry.name}.",
                )
            }

            val existingApp = existingApps.singleOrNull()
            if (existingApp == null) {
                appRepository.save(
                    App(
                        name = entry.name,
                        port = entry.port,
                        isEnabled = false,
                    ),
                )
                insertedCount += 1
            } else {
                existingApp.name = entry.name
                existingApp.port = entry.port
                appRepository.save(existingApp)
                updatedCount += 1
            }
        }

        return AppCatalogSyncResult(
            insertedCount = insertedCount,
            updatedCount = updatedCount,
        )
    }
}

@Component
class AppCatalogStartupSync(
    private val properties: DashwayConfigProperties,
    private val reader: DashwayConfigAppCatalogReader,
    private val syncService: AppCatalogSyncService,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        val rawPath = properties.path.trim()
        if (rawPath.isBlank()) {
            logger.info { "DASHWAY_CONFIG_PATH is not set. Skipping app catalog sync." }
            return
        }

        val entries = reader.read(Path.of(rawPath))
        val result = syncService.sync(entries)
        logger.info {
            "Synced app catalog from $rawPath: inserted=${result.insertedCount}, updated=${result.updatedCount}"
        }
    }
}
