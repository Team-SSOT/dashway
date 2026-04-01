package ai.ssot.contextapi.security.token

import ai.ssot.contextapi.PostgresBehaviorSpecSupport
import ai.ssot.contextapi.security.exception.InvalidTokenPrefixException
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.collections.shouldContainExactly
import io.kotest.matchers.shouldBe
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class TokenServiceIntegrationTests : PostgresBehaviorSpecSupport() {
    @Autowired
    private lateinit var tokenService: TokenService

    init {
        given("access token generation") {
            `when`("a token is issued with member roles") {
                then("verify succeeds and exposes member id and roles from the claims") {
                    val token = tokenService.generateAccessToken(
                        memberId = 7L,
                        roles = listOf("ADMIN", "MEMBER"),
                    )

                    tokenService.verify("Bearer $token") shouldBe true
                    tokenService.getMemberId(token) shouldBe 7L
                    tokenService.getRoles(token) shouldContainExactly listOf("ADMIN", "MEMBER")
                }
            }

            `when`("the bearer prefix is missing") {
                then("verify throws the token prefix exception") {
                    val token = tokenService.generateAccessToken(
                        memberId = 7L,
                        roles = listOf("ADMIN"),
                    )

                    shouldThrow<InvalidTokenPrefixException> {
                        tokenService.verify(token)
                    }
                }
            }
        }
    }
}
