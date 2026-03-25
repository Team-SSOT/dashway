package ai.ssot.contextapi.domain.app.controller

import ai.ssot.contextapi.GraphqlIntegrationTestSupport
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.util.*
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@SpringBootTest
@AutoConfigureMockMvc
class AppGraphqlIntegrationTests : GraphqlIntegrationTestSupport() {
    @Test
    fun `returns top level validation errors for blank app names`() {
        val admin = bootstrapAdmin()

        val response = executeGraphqlAndReadAllowErrors(
            """
            mutation {
              registerApp(input: { name: "   " }) {
                id
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )

        assertTrue(response.at("/data/registerApp").isNull)
        assertEquals("VALIDATION_ERROR", response.textAt("/errors/0/extensions/code"))
        assertEquals("name", response.textAt("/errors/0/extensions/violations/0/field"))
        assertEquals("name is required.", response.textAt("/errors/0/extensions/violations/0/message"))
    }

    @Test
    fun `registers and deactivates apps over graphql`() {
        val admin = bootstrapAdmin()
        val appId = registerApp("docs", admin.accessToken)

        executeGraphql(
            """
            mutation {
              deactivateApp(input: { id: "$appId" }) {
                id
                enabled
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.deactivateApp.id").value(appId))
            .andExpect(jsonPath("$.data.deactivateApp.enabled").value(false))
            .andExpect(jsonPath("$.errors").doesNotExist())

        executeGraphql(
            """
            mutation {
              deactivateApp(input: { id: "$appId" }) {
                id
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.deactivateApp").doesNotExist())
            .andExpect(jsonPath("$.errors[0].extensions.code").value("APP_ALREADY_DISABLED"))
    }

    @Test
    fun `validates app ids and reports missing apps through top level errors`() {
        val admin = bootstrapAdmin()

        executeGraphql(
            """
            mutation {
              deactivateApp(input: { id: "not-a-uuid" }) {
                id
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.deactivateApp").doesNotExist())
            .andExpect(jsonPath("$.errors[0].extensions.code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.errors[0].extensions.violations[0].field").value("id"))
            .andExpect(jsonPath("$.errors[0].message").value("App id must be a UUID."))

        val missingAppId = UUID.randomUUID().toString()
        executeGraphql(
            """
            mutation {
              deactivateApp(input: { id: "$missingAppId" }) {
                id
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.deactivateApp").doesNotExist())
            .andExpect(jsonPath("$.errors[0].extensions.code").value("NOT_FOUND"))
            .andExpect(jsonPath("$.errors[0].message").value("App not found."))
    }

    private fun registerApp(name: String, accessToken: String): String =
        executeGraphqlAndRead(
            """
            mutation {
              registerApp(input: { name: "$name" }) {
                id
              }
            }
            """.trimIndent(),
            accessToken,
        ).textAt("/data/registerApp/id")
}
