package ai.ssot.contextapi.domain.auth.controller

import ai.ssot.contextapi.GraphqlIntegrationTestSupport
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import kotlin.test.assertNotEquals

@SpringBootTest
@AutoConfigureMockMvc
class AuthGraphqlIntegrationTests : GraphqlIntegrationTestSupport() {
    @Test
    fun `bootstraps first admin and resolves me with an access token`() {
        val admin = bootstrapAdmin()

        executeGraphql(
            """
            query {
              me {
                id
                email
                admin
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.me.id").value(admin.memberId.toInt()))
            .andExpect(jsonPath("$.data.me.email").value("admin@example.com"))
            .andExpect(jsonPath("$.data.me.admin").value(true))
    }

    @Test
    fun `rotates refresh tokens and rejects reused refresh tokens`() {
        val admin = bootstrapAdmin()

        val refreshResponse = executeGraphqlAndRead(
            """
            mutation {
              refreshToken(input: { refreshToken: "${admin.refreshToken}" }) {
                member {
                  id
                }
                tokens {
                  accessToken
                  refreshToken
                }
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
        )

        val rotatedAccessToken = refreshResponse.textAt("/data/refreshToken/tokens/accessToken")
        val rotatedRefreshToken = refreshResponse.textAt("/data/refreshToken/tokens/refreshToken")
        assertNotEquals("", rotatedAccessToken)
        assertNotEquals(admin.refreshToken, rotatedRefreshToken)

        executeGraphql(
            """
            mutation {
              refreshToken(input: { refreshToken: "${admin.refreshToken}" }) {
                member {
                  id
                }
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.refreshToken.member").doesNotExist())
            .andExpect(jsonPath("$.data.refreshToken.errors[0].code").value("INVALID_REFRESH_TOKEN"))

        executeGraphql(
            """
            mutation {
              logout(input: { refreshToken: "$rotatedRefreshToken" }) {
                loggedOut
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.logout.loggedOut").value(true))
            .andExpect(jsonPath("$.data.logout.errors").isEmpty())
    }

    @Test
    fun `rejects refresh tokens after logout`() {
        val admin = bootstrapAdmin()

        executeGraphql(
            """
            mutation {
              logout(input: { refreshToken: "${admin.refreshToken}" }) {
                loggedOut
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.logout.loggedOut").value(true))
            .andExpect(jsonPath("$.data.logout.errors").isEmpty())

        executeGraphql(
            """
            mutation {
              refreshToken(input: { refreshToken: "${admin.refreshToken}" }) {
                member {
                  id
                }
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.refreshToken.member").doesNotExist())
            .andExpect(jsonPath("$.data.refreshToken.errors[0].code").value("INVALID_REFRESH_TOKEN"))
    }

    @Test
    fun `rejects refresh tokens for disabled members`() {
        val admin = bootstrapAdmin()
        val memberId = registerMember(
            name = "Disabled User",
            email = "disabled@example.com",
            password = "disabled-password",
            accessToken = admin.accessToken,
        )
        val user = login("disabled@example.com", "disabled-password")

        executeGraphql(
            """
            mutation {
              updateMember(input: {
                id: $memberId
                enabled: false
              }) {
                member {
                  id
                  enabled
                }
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.updateMember.member.enabled").value(false))
            .andExpect(jsonPath("$.data.updateMember.errors").isEmpty())

        executeGraphql(
            """
            mutation {
              refreshToken(input: { refreshToken: "${user.refreshToken}" }) {
                member {
                  id
                }
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.refreshToken.member").doesNotExist())
            .andExpect(jsonPath("$.data.refreshToken.errors[0].code").value("INVALID_REFRESH_TOKEN"))
    }

    @Test
    fun `allows non admin to update only self`() {
        val admin = bootstrapAdmin()
        val memberId = registerMember(
            name = "User",
            email = "user@example.com",
            password = "user-password",
            accessToken = admin.accessToken,
        )
        val user = login("user@example.com", "user-password")

        executeGraphql(
            """
            mutation {
              updateMember(input: {
                id: $memberId
                name: "Updated User"
              }) {
                member {
                  id
                  name
                }
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            user.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.updateMember.member.name").value("Updated User"))
            .andExpect(jsonPath("$.data.updateMember.errors").isEmpty())

        executeGraphql(
            """
            mutation {
              updateMember(input: {
                id: ${admin.memberId}
                name: "Hijacked"
              }) {
                member {
                  id
                }
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            user.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.updateMember.member").doesNotExist())
            .andExpect(jsonPath("$.data.updateMember.errors[0].code").value("FORBIDDEN"))
    }
}
