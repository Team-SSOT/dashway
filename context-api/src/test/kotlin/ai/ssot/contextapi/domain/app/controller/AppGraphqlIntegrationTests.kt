package ai.ssot.contextapi.domain.app.controller

import ai.ssot.contextapi.GraphqlIntegrationTestSupport
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@SpringBootTest
@AutoConfigureMockMvc
class AppGraphqlIntegrationTests : GraphqlIntegrationTestSupport() {
    @Test
    fun `returns validation errors in the mutation payload for blank app names`() {
        val admin = bootstrapAdmin()

        val response = executeGraphqlAndRead(
            """
            mutation {
              registerApp(input: { name: "   " }) {
                app {
                  id
                }
                errors {
                  code
                  message
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )

        assertTrue(response.at("/data/registerApp/app").isNull)
        assertEquals("VALIDATION_ERROR", response.textAt("/data/registerApp/errors/0/code"))
        assertEquals("name is required.", response.textAt("/data/registerApp/errors/0/message"))
    }

    @Test
    fun `registers and deactivates apps over graphql`() {
        val admin = bootstrapAdmin()
        val appId = registerApp("docs", admin.accessToken)

        executeGraphql(
            """
            mutation {
              deactivateApp(input: { id: "$appId" }) {
                app {
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
            .andExpect(jsonPath("$.data.deactivateApp.app.id").value(appId))
            .andExpect(jsonPath("$.data.deactivateApp.app.enabled").value(false))
            .andExpect(jsonPath("$.data.deactivateApp.errors").isEmpty())

        executeGraphql(
            """
            mutation {
              deactivateApp(input: { id: "$appId" }) {
                app {
                  id
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
            .andExpect(jsonPath("$.data.deactivateApp.errors[0].code").value("APP_ALREADY_DISABLED"))
    }

    @Test
    fun `validates app ids and reports missing apps through payload errors`() {
        val admin = bootstrapAdmin()

        executeGraphql(
            """
            mutation {
              deactivateApp(input: { id: "not-a-uuid" }) {
                app {
                  id
                }
                errors {
                  code
                  message
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.deactivateApp.app").doesNotExist())
            .andExpect(jsonPath("$.data.deactivateApp.errors[0].code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.data.deactivateApp.errors[0].message").value("App id must be a UUID."))

        val missingAppId = UUID.randomUUID().toString()
        executeGraphql(
            """
            mutation {
              deactivateApp(input: { id: "$missingAppId" }) {
                app {
                  id
                }
                errors {
                  code
                  message
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.deactivateApp.app").doesNotExist())
            .andExpect(jsonPath("$.data.deactivateApp.errors[0].code").value("NOT_FOUND"))
            .andExpect(jsonPath("$.data.deactivateApp.errors[0].message").value("App not found."))
    }

    private fun registerApp(name: String, accessToken: String): String =
        executeGraphqlAndRead(
            """
            mutation {
              registerApp(input: { name: "$name" }) {
                app {
                  id
                }
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            accessToken,
        ).textAt("/data/registerApp/app/id")
}
