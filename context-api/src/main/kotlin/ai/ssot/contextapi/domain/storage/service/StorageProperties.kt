package ai.ssot.contextapi.domain.storage.service

import org.springframework.boot.context.properties.ConfigurationProperties
import java.nio.file.Path

@ConfigurationProperties(prefix = "context-api.storage")
data class StorageProperties(
    val localRoot: Path = Path.of(
        System.getProperty("user.home"),
        "dashway",
        "files",
    ),
)
