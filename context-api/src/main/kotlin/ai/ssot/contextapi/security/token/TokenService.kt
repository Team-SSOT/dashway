package ai.ssot.contextapi.security.token

import ai.ssot.contextapi.security.exception.InvalidTokenPrefixException
import ai.ssot.contextapi.security.exception.MalformedTokenException
import ai.ssot.contextapi.security.exception.TokenExpirationException
import ai.ssot.contextapi.security.exception.UnauthenticatedException
import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.MalformedJwtException
import io.jsonwebtoken.security.Keys
import io.jsonwebtoken.security.SignatureException
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.token.Sha512DigestUtils
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.io.IOException
import java.util.*

@Service
class TokenService {

    companion object {
        const val ACCESS_TOKEN_HEADER = "Authorization"
        const val REFRESH_TOKEN_HEADER = "Refresh"
        const val TOKEN_PREFIX = "Bearer ";
    }

    @Value(value = "\${token.expiration.access}")
    var ACCESS_TOKEN_EXPIRATION : Long = 14400

    @Value(value = "\${token.expiration.refresh}")
    var REFRESH_TOKEN_EXPIRATION : Long = 144000

    @Value(value = "\${token.secret}")
    lateinit var TOKEN_SECRET : String


    @Transactional
    fun generateTokens(userId: Long, userRole: String): Pair<String, String> {
        return generateAccessToken(userId, userRole) to generateRefreshToken(userId, userRole)
    }


    private fun generateAccessToken(userId: Long, userRole: String) =
        generateToken(userId, userRole, ACCESS_TOKEN_EXPIRATION)

    private fun generateRefreshToken(userId: Long, userRole: String) =
        generateToken(userId, userRole, REFRESH_TOKEN_EXPIRATION)



    private fun generateToken(userId: Long, userRole: String, tokenExpirationTime: Long): String {

        val claims = createClaims(userId, userRole)

        val now = Date()
        val expiredDate = Date(now.time + (tokenExpirationTime * 1000))

        return Jwts.builder()
            .claims(claims)
            .issuedAt(now)
            .expiration(expiredDate)
            .signWith(getSecretKey())
            .compact()
    }


    private fun createClaims(userId: Long, userRole: String) =
        Jwts.claims()
            .id(userId.toString())
            .also {
                it.add("role", userRole)
            }.build()

    private fun getSecretKey() = Keys.hmacShaKeyFor(
        Base64.getEncoder().encode(Sha512DigestUtils.sha(TOKEN_SECRET))
    )


    @Throws(IOException::class)
    fun verify(tokenWithPrefix: String): Boolean {
        if (!tokenWithPrefix.startsWith(TOKEN_PREFIX)) {
            throw InvalidTokenPrefixException()
        } else {
            runCatching {
                val token = tokenWithPrefix.replace(TOKEN_PREFIX, "")
                getClaims(token).payload
                return true
            }.onFailure { exception ->
                throw when(exception) {
                    is MalformedJwtException -> MalformedTokenException()
                    is ExpiredJwtException -> TokenExpirationException()
                    else -> UnauthenticatedException()
                }
            }
        }
        return false
    }

    fun getId(tokenWithoutPrefix: String): String {
        return (getClaims(tokenWithoutPrefix).payload  as Claims).id
    }

    fun getUserRole(tokenWithoutPrefix: String): String {
        return (getClaims(tokenWithoutPrefix).payload  as Claims)["role"] as String
    }

    private fun getClaims(token: String) = Jwts.parser().verifyWith(getSecretKey()).build().parse(token)
}