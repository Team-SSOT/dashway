package ai.ssot.contextapi.shared.graphql

import ai.ssot.contextapi.GraphqlIntegrationTestSupport
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@SpringBootTest
@AutoConfigureMockMvc
class GraphQlExceptionHandlingIntegrationTests : GraphqlIntegrationTestSupport() {
    @Test
    fun `falls back to the DGS default handler for unexpected runtime exceptions`() {
        val response = executeGraphqlAndReadAllowErrors(
            """
            query {
              testUnhandledException
            }
            """.trimIndent(),
        )

        assertTrue(response.at("/data/testUnhandledException").isNull)
        assertEquals("INTERNAL", response.textAt("/errors/0/extensions/errorType"))
        assertEquals(
            "java.lang.IllegalStateException: Unexpected test exception.",
            response.textAt("/errors/0/message"),
        )
    }
}
