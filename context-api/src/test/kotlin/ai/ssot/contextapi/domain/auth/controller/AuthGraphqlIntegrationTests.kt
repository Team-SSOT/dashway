package ai.ssot.contextapi.domain.auth.controller

import ai.ssot.contextapi.GraphqlIntegrationTestSupport
import org.hamcrest.Matchers.nullValue
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
            .andExpect(jsonPath("$.errors").doesNotExist())
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
              }
            }
            """.trimIndent(),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
            .andExpect(jsonPath("$.errors[0].extensions.code").value("INVALID_REFRESH_TOKEN"))

        executeGraphql(
            """
            mutation {
              logout(input: { refreshToken: "$rotatedRefreshToken" })
            }
            """.trimIndent(),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.logout").value(true))
            .andExpect(jsonPath("$.errors").doesNotExist())
    }

    @Test
    fun `rejects refresh tokens after logout`() {
        val admin = bootstrapAdmin()

        executeGraphql(
            """
            mutation {
              logout(input: { refreshToken: "${admin.refreshToken}" })
            }
            """.trimIndent(),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.logout").value(true))
            .andExpect(jsonPath("$.errors").doesNotExist())

        executeGraphql(
            """
            mutation {
              refreshToken(input: { refreshToken: "${admin.refreshToken}" }) {
                member {
                  id
                }
              }
            }
            """.trimIndent(),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
            .andExpect(jsonPath("$.errors[0].extensions.code").value("INVALID_REFRESH_TOKEN"))
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
                id
                enabled
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.updateMember.enabled").value(false))
            .andExpect(jsonPath("$.errors").doesNotExist())

        executeGraphql(
            """
            mutation {
              refreshToken(input: { refreshToken: "${user.refreshToken}" }) {
                member {
                  id
                }
              }
            }
            """.trimIndent(),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.refreshToken").doesNotExist())
            .andExpect(jsonPath("$.errors[0].extensions.code").value("INVALID_REFRESH_TOKEN"))
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
                id
                name
              }
            }
            """.trimIndent(),
            user.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.updateMember.name").value("Updated User"))
            .andExpect(jsonPath("$.errors").doesNotExist())

        executeGraphql(
            """
            mutation {
              updateMember(input: {
                id: ${admin.memberId}
                name: "Hijacked"
              }) {
                id
              }
            }
            """.trimIndent(),
            user.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.updateMember").doesNotExist())
            .andExpect(jsonPath("$.errors[0].extensions.code").value("FORBIDDEN"))
    }

    @Test
    fun `returns filter authentication failures as graphql top level errors`() {
        executeGraphql(
            """
            query {
              me {
                id
              }
            }
            """.trimIndent(),
            "invalid-access-token",
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data").value(nullValue()))
            .andExpect(jsonPath("$.errors[0].extensions.errorType").value("PERMISSION_DENIED"))
            .andExpect(jsonPath("$.errors[0].extensions.code").value("UNAUTHENTICATED"))
    }

    @Test
    fun `returns missing authentication as graphql top level errors`() {
        executeGraphql(
            """
            query {
              me {
                id
              }
            }
            """.trimIndent(),
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.me").doesNotExist())
            .andExpect(jsonPath("$.errors[0].extensions.code").value("UNAUTHENTICATED"))
    }
}
