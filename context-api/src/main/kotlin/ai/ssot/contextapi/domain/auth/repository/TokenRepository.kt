package ai.ssot.contextapi.domain.auth.repository

import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.stereotype.Repository
import java.time.Duration

@Repository
class TokenRepository(
    private val redisTemplate: StringRedisTemplate,
) {
    fun saveBlacklistToken(token: String, ttlSeconds: Long) {
        redisTemplate.opsForValue()
            .set(
                getRefreshTokenKey(getBlackListTokenKey(token)),
                token,
                Duration.ofSeconds(ttlSeconds),
            )

    }

    fun saveRefreshToken(memberId: Long, refreshToken: String, ttlSeconds: Long) {
        redisTemplate.opsForValue()
            .set(
                getRefreshTokenKey(refreshToken),
                memberId.toString(),
                Duration.ofSeconds(ttlSeconds),
            )
    }

    fun deleteRefreshToken(refreshToken: String): Boolean =
        redisTemplate.delete(getRefreshTokenKey(refreshToken))

    private fun getRefreshTokenKey(refreshToken: String): String = "refresh:$refreshToken"
    private fun getBlackListTokenKey(token: String): String = "blacklist:$token"
}
