package ai.ssot.contextapi.security.token

import ai.ssot.contextapi.security.AuthProperties
import ai.ssot.contextapi.security.exception.InvalidTokenPrefixException
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue
import kotlin.test.assertFailsWith

class TokenServiceIntegrationTests {
    private val tokenService = TokenService(
        AuthProperties(
            issuer = "context-api-test",
            accessTokenTtl = 900,
            refreshTokenTtl = 604800,
            jwtSecret = "0123456789abcdef0123456789abcdef",
        ),
    )

    @Test
    fun `verify succeeds and exposes member id and roles from the claims`() {
        val token = tokenService.generateAccessToken(
            memberId = 7L,
            roles = listOf("ADMIN", "MEMBER"),
        )

        assertTrue(tokenService.verify("Bearer $token"))
        assertEquals(7L, tokenService.getMemberId(token))
        assertEquals(listOf("ADMIN", "MEMBER"), tokenService.getRoles(token))
    }

    @Test
    fun `verify throws the token prefix exception when the bearer prefix is missing`() {
        val token = tokenService.generateAccessToken(
            memberId = 7L,
            roles = listOf("ADMIN"),
        )

        assertFailsWith<InvalidTokenPrefixException> {
            tokenService.verify(token)
        }
    }
}
