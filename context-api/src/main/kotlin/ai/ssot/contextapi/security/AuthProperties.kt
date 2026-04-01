package ai.ssot.contextapi.security

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "context-api.auth")
data class AuthProperties(
    val issuer: String,
    val accessTokenTtl: Long,
    val refreshTokenTtl: Long,
    val jwtSecret: String,
    val corsAllowedOrigins: List<String> = emptyList(),
    val refreshCookie: RefreshCookie = RefreshCookie(),
) {
    init {
        require(issuer.isNotBlank()) { "context-api.auth.issuer must not be blank." }
        require(accessTokenTtl > 0) { "context-api.auth.access-token-ttl must be positive." }
        require(refreshTokenTtl > 0) { "context-api.auth.refresh-token-ttl must be positive." }
        require(jwtSecret.length >= 32) { "context-api.auth.jwt-secret must be at least 32 characters." }
        require(refreshCookie.path.isNotBlank()) { "context-api.auth.refresh-cookie.path must not be blank." }
        require(refreshCookie.sameSite.isNotBlank()) { "context-api.auth.refresh-cookie.same-site must not be blank." }
    }

    data class RefreshCookie(
        val path: String = "/graphql",
        val secure: Boolean = true,
        val sameSite: String = "None",
    )
}
