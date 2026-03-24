package ai.ssot.contextapi.security

import org.springframework.boot.context.properties.ConfigurationProperties
import java.time.Duration

@ConfigurationProperties(prefix = "context-api.auth")
data class AuthProperties(
    val issuer: String,
    val accessTokenTtl: Duration,
    val refreshTokenTtl: Duration,
    val jwtSecret: String,
) {
    init {
        require(issuer.isNotBlank()) { "context-api.auth.issuer must not be blank." }
        require(accessTokenTtl.isPositive) { "context-api.auth.access-token-ttl must be positive." }
        require(refreshTokenTtl.isPositive) { "context-api.auth.refresh-token-ttl must be positive." }
        require(jwtSecret.length >= 32) { "context-api.auth.jwt-secret must be at least 32 characters." }
    }
}
