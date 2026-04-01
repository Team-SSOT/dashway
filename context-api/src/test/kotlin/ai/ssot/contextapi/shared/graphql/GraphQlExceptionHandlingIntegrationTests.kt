package ai.ssot.contextapi.shared.graphql

import ai.ssot.contextapi.GraphqlBehaviorSpecSupport
import ai.ssot.contextapi.TEST_AUTOCONFIG_EXCLUDES
import io.kotest.matchers.shouldBe
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc

@SpringBootTest(properties = [TEST_AUTOCONFIG_EXCLUDES])
@AutoConfigureMockMvc
class GraphQlExceptionHandlingIntegrationTests : GraphqlBehaviorSpecSupport() {
    init {
        given("graphql exception handling") {
            `when`("an unexpected runtime exception is thrown") {
                then("returns the shared graphql error shape") {
                    val response = executeGraphqlAndReadAllowErrors(
                        """
                        query {
                          testUnhandledException
                        }
                        """.trimIndent(),
                    )

                    response.at("/data/testUnhandledException").isNull shouldBe true
                    response.at("/errors/0/extensions/errorType").isMissingNode shouldBe true
                    response.textAt("/errors/0/message") shouldBe "Unexpected test exception."
                }
            }
        }
    }
}
