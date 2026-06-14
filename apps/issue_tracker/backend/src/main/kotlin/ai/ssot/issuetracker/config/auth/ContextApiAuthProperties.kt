package ai.ssot.issuetracker.config.auth

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "issue-tracker.context-api")
data class ContextApiAuthProperties(
    val baseUrl: String = "http://localhost:8080",
) {
    init {
        require(baseUrl.isNotBlank()) { "issue-tracker.context-api.base-url must not be blank." }
    }

    fun normalizedBaseUrl(): String = baseUrl.trimEnd('/')
}
