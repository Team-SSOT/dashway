package ai.ssot.contextapi.domain.auth.repository

import ai.ssot.contextapi.security.AuthProperties
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Repository
import java.util.UUID

interface RefreshTokenRepository {
    fun create(memberId: Long): String

    fun consume(refreshToken: String): Long?

    fun delete(refreshToken: String)
}

@Repository
class RedisRefreshTokenRepository(
    private val authProperties: AuthProperties,
    private val stringRedisTemplate: StringRedisTemplate,
) : RefreshTokenRepository {
    override fun create(memberId: Long): String {
        val refreshToken = UUID.randomUUID().toString() + UUID.randomUUID().toString()
        stringRedisTemplate.opsForValue().set(
            key(refreshToken),
            memberId.toString(),
            authProperties.refreshTokenTtl,
        )
        return refreshToken
    }

    override fun consume(refreshToken: String): Long? =
        stringRedisTemplate
            .opsForValue()
            .getAndDelete(key(refreshToken))
            ?.toLongOrNull()

    override fun delete(refreshToken: String) {
        stringRedisTemplate.delete(key(refreshToken))
    }

    private fun key(refreshToken: String): String = "context-api:auth:refresh:$refreshToken"
}
