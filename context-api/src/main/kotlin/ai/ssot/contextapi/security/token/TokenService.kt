package ai.ssot.contextapi.security.token

import ai.ssot.contextapi.security.AuthProperties
import ai.ssot.contextapi.security.exception.InvalidTokenPrefixException
import ai.ssot.contextapi.security.exception.MalformedTokenException
import ai.ssot.contextapi.security.exception.TokenExpirationException
import ai.ssot.contextapi.security.exception.UnauthenticatedException
import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.MalformedJwtException
import io.jsonwebtoken.security.Keys
import org.springframework.security.core.token.Sha512DigestUtils
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.IOException
import java.time.LocalDateTime
import java.time.ZoneOffset
import java.util.*

@Service
class TokenService(
    private val authProperties: AuthProperties,
) {

    companion object {
        const val ACCESS_TOKEN_HEADER = "Authorization"
        const val REFRESH_TOKEN_HEADER = "Refresh"
        const val TOKEN_PREFIX = "Bearer "
    }

    @Transactional
    fun generateTokens(memberId: Long, roles: List<String>): Pair<String, String> {
        return generateAccessToken(memberId, roles) to generateRefreshToken(memberId, roles)
    }

    fun generateAccessToken(memberId: Long, roles: List<String>): String =
        generateToken(memberId, roles, authProperties.accessTokenTtl)

    private fun generateRefreshToken(memberId: Long, roles: List<String>) =
        generateToken(memberId, roles, authProperties.refreshTokenTtl)

    private fun generateToken(
        memberId: Long,
        roles: List<String>,
        tokenTtlSeconds: Long,
        additionalClaims: Map<String, Any> = emptyMap(),
    ): String {
        val claims = createClaims(memberId, roles, additionalClaims)
        val now = Date()
        val expiredDate = Date(now.time + (tokenTtlSeconds * 1000))

        return Jwts.builder()
            .issuer(authProperties.issuer)
            .claims(claims)
            .issuedAt(now)
            .expiration(expiredDate)
            .signWith(getSecretKey())
            .compact()
    }

    private fun createClaims(
        memberId: Long,
        roles: List<String>,
        additionalClaims: Map<String, Any>,
    ): Claims {
        val builder = Jwts.claims()
            .id(memberId.toString())
            .add("roles", roles)

        additionalClaims.forEach { (key, value) ->
            builder.add(key, value)
        }

        return builder.build()
    }

    private fun getSecretKey() = Keys.hmacShaKeyFor(
        Base64.getEncoder().encode(Sha512DigestUtils.sha(authProperties.jwtSecret))
    )

    @Throws(IOException::class)
    fun verify(tokenWithPrefix: String): Boolean {
        if (!tokenWithPrefix.startsWith(TOKEN_PREFIX)) {
            throw InvalidTokenPrefixException()
        }
        runCatching {
            val token = tokenWithPrefix.removePrefix(TOKEN_PREFIX)
            getClaims(token)
            return true
        }.onFailure { exception ->
            throw when (exception) {
                is MalformedJwtException -> MalformedTokenException()
                is ExpiredJwtException -> TokenExpirationException()
                else -> UnauthenticatedException()
            }
        }
        return false
    }

    fun getMemberId(tokenWithoutPrefix: String): Long {
        return getClaims(tokenWithoutPrefix).id.toLong()
    }

    private fun getClaims(token: String): Claims =
        Jwts.parser().verifyWith(getSecretKey()).build().parseSignedClaims(token).payload

    fun getTtl(token: String): Long {
        return getClaims(token).expiration.time - LocalDateTime.now().toEpochSecond(ZoneOffset.UTC)
    }
    fun getRoles(token: String): List<String> {
        return getClaims(token).get("roles", List::class.java)
            ?.map { it.toString() }
            ?: emptyList()
    }
}
