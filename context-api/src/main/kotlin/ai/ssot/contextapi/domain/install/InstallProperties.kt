package ai.ssot.contextapi.domain.install

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "context-api.install")
data class InstallProperties(
    val bootstrapEnabled: Boolean = false,
    val bootstrapSecret: String = "",
) {
    init {
        if (bootstrapEnabled) {
            require(bootstrapSecret.isNotBlank()) {
                "context-api.install.bootstrap-secret must not be blank when bootstrap is enabled."
            }
        }
    }

    companion object {
        const val BOOTSTRAP_SECRET_HEADER = "X-Dashway-Install-Secret"
    }
}
