package ai.ssot.contextapi.security.token

import ai.ssot.contextapi.PostgresIntegrationTestSupport
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@SpringBootTest
class TokenServiceIntegrationTests : PostgresIntegrationTestSupport() {
    @Autowired
    private lateinit var tokenService: TokenService

    @Test
    fun `issues access tokens with expected claims`() {
        val token = tokenService.generateAccessToken(
            userId = 7L,
            isAdmin = true,
        )

        assertTrue(tokenService.verify("Bearer $token"))
        assertEquals("7", tokenService.getId(token))
        assertEquals(true, tokenService.isAdmin(token))
    }
}
