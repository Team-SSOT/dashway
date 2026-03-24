package ai.ssot.contextapi.security.token

import ai.ssot.contextapi.PostgresIntegrationTestSupport
import ai.ssot.contextapi.domain.member.service.MemberAuthLookup
import ai.ssot.contextapi.security.principal.AuthenticatedMemberPrincipal
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.oauth2.jwt.JwtDecoder
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset

@SpringBootTest
class AccessTokenServiceIntegrationTests : PostgresIntegrationTestSupport() {
    @Autowired
    private lateinit var accessTokenService: AccessTokenService

    @Autowired
    private lateinit var jwtDecoder: JwtDecoder

    @Test
    fun `issues access tokens with expected claims and admin authorities`() {
        val issuedToken = accessTokenService.issue(
            member(
                id = 7L,
                email = "admin@example.com",
                admin = true,
            ),
        )

        val jwt = jwtDecoder.decode(issuedToken.tokenValue)
        val authentication = accessTokenService.toAuthentication(jwt)
        val principal = authentication.principal as AuthenticatedMemberPrincipal

        assertEquals("7", jwt.subject)
        assertEquals("admin@example.com", jwt.getClaimAsString("email"))
        assertEquals(true, jwt.getClaim<Boolean>("admin"))
        assertEquals(issuedToken.expiresAt.epochSecond, jwt.expiresAt?.epochSecond)
        assertEquals(7L, principal.memberId)
        assertEquals("admin@example.com", principal.email)
        assertTrue(principal.admin)
        assertTrue(authentication.authorities.any { it.authority == "ROLE_USER" })
        assertTrue(authentication.authorities.any { it.authority == "ROLE_ADMIN" })
    }

    @Test
    fun `does not add admin authority for non admin tokens`() {
        val issuedToken = accessTokenService.issue(
            member(
                id = 8L,
                email = "member@example.com",
                admin = false,
            ),
        )

        val authentication = accessTokenService.toAuthentication(jwtDecoder.decode(issuedToken.tokenValue))
        val principal = authentication.principal as AuthenticatedMemberPrincipal

        assertFalse(principal.admin)
        assertTrue(authentication.authorities.any { it.authority == "ROLE_USER" })
        assertFalse(authentication.authorities.any { it.authority == "ROLE_ADMIN" })
    }

    private fun member(
        id: Long,
        email: String,
        admin: Boolean,
    ): MemberAuthLookup =
        MemberAuthLookup(
            id = id,
            name = email.substringBefore("@"),
            email = email,
            passwordHash = "hash",
            admin = admin,
            enabled = true,
            createdAt = LocalDateTime.ofInstant(Instant.parse("2026-03-23T00:00:00Z"), ZoneOffset.UTC),
        )
}
