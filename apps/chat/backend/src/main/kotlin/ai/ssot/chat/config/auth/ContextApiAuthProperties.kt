package ai.ssot.chat.config.auth

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "chat.context-api")
data class ContextApiAuthProperties(
    val baseUrl: String = "http://localhost:8080",
) {
    init {
        require(baseUrl.isNotBlank()) { "chat.context-api.base-url must not be blank." }
    }

    fun normalizedBaseUrl(): String = baseUrl.trimEnd('/')
}
