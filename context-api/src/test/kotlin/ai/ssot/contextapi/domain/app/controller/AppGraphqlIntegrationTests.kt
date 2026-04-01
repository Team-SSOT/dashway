package ai.ssot.contextapi.domain.app.controller

import ai.ssot.contextapi.GraphqlBehaviorSpecSupport
import ai.ssot.contextapi.TEST_AUTOCONFIG_EXCLUDES
import ai.ssot.contextapi.domain.app.entity.App
import ai.ssot.contextapi.domain.app.repository.AppRepository
import ai.ssot.contextapi.generated.client.ActivateAppGraphQLQuery
import ai.ssot.contextapi.generated.client.ActivateAppProjectionRoot
import ai.ssot.contextapi.generated.client.AppGraphQLQuery
import ai.ssot.contextapi.generated.client.AppProjectionRoot
import ai.ssot.contextapi.generated.client.AppsGraphQLQuery
import ai.ssot.contextapi.generated.client.AppsProjectionRoot
import ai.ssot.contextapi.generated.client.DeactivateAppGraphQLQuery
import ai.ssot.contextapi.generated.client.DeactivateAppProjectionRoot
import ai.ssot.contextapi.generated.types.ActivateAppInput
import ai.ssot.contextapi.generated.types.DeactivateAppInput
import com.netflix.graphql.dgs.client.codegen.GraphQLQueryRequest
import io.kotest.matchers.shouldBe
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import tools.jackson.databind.JsonNode
import java.util.UUID

@SpringBootTest(properties = [TEST_AUTOCONFIG_EXCLUDES])
@AutoConfigureMockMvc
class AppGraphqlIntegrationTests : GraphqlBehaviorSpecSupport() {
    @Autowired
    private lateinit var appRepository: AppRepository

    init {
        given("apps") {
            `when`("an admin requests the app page with valid paging") {
                then("returns apps in latest created order with page info") {
                    val admin = bootstrapAdmin()
                    val docsId = createFixtureApp(name = "docs", port = 8080)
                    val adminConsoleId = createFixtureApp(name = "admin-console", port = 8081, isEnabled = false)

                    val response = executeGraphqlAndRead(
                        appsRequest(page = 0, size = 10),
                        accessToken = admin.accessToken,
                    )

                    response.longAt("/data/apps/pageInfo/page") shouldBe 0L
                    response.longAt("/data/apps/pageInfo/size") shouldBe 10L
                    response.longAt("/data/apps/pageInfo/totalElements") shouldBe 2L
                    response.longAt("/data/apps/pageInfo/totalPages") shouldBe 1L
                    response.textAt("/data/apps/apps/0/id") shouldBe adminConsoleId.toString()
                    response.textAt("/data/apps/apps/1/id") shouldBe docsId.toString()
                    response.textAt("/data/apps/apps/0/name") shouldBe "admin-console"
                    response.textAt("/data/apps/apps/1/name") shouldBe "docs"
                    response.at("/data/apps/apps/0/isEnabled").asBoolean() shouldBe false
                    response.at("/data/apps/apps/1/isEnabled").asBoolean() shouldBe true
                }
            }

            `when`("paging is invalid") {
                then("returns the current page validation messages") {
                    val admin = bootstrapAdmin()
                    val responses = listOf(
                        executeGraphqlAndReadAllowErrors(
                            appsRequest(page = -1, size = 10),
                            accessToken = admin.accessToken,
                        ) to "page must be 0 or greater.",
                        executeGraphqlAndReadAllowErrors(
                            appsRequest(page = 0, size = 0),
                            accessToken = admin.accessToken,
                        ) to "size must be between 1 and 100.",
                    )

                    responses.forEach { (response, message) ->
                        val appsNode = response.at("/data/apps")
                        (appsNode.isMissingNode || appsNode.isNull) shouldBe true
                        response.textAt("/errors/0/message") shouldBe message
                        response.at("/errors/0/extensions").isMissingNode shouldBe true
                    }
                }
            }
        }

        given("app") {
            `when`("an admin requests an existing app") {
                then("returns the app details") {
                    val admin = bootstrapAdmin()
                    val appId = createFixtureApp(name = "docs", port = 8080)

                    val response = executeGraphqlAndRead(
                        appRequest(appId.toString()),
                        accessToken = admin.accessToken,
                    )

                    response.textAt("/data/app/id") shouldBe appId.toString()
                    response.textAt("/data/app/name") shouldBe "docs"
                    response.longAt("/data/app/port") shouldBe 8080L
                    response.at("/data/app/isEnabled").asBoolean() shouldBe true
                }
            }

            `when`("the app id is invalid or missing") {
                then("returns the current parser and not found contracts") {
                    val admin = bootstrapAdmin()
                    val missingAppId = UUID.randomUUID().toString()

                    val invalidResponse = executeGraphqlAndReadAllowErrors(
                        appRequest("not-a-uuid"),
                        accessToken = admin.accessToken,
                    )
                    val missingResponse = executeGraphqlAndReadAllowErrors(
                        appRequest(missingAppId),
                        accessToken = admin.accessToken,
                    )

                    assertOperationError(
                        response = invalidResponse,
                        operationName = "app",
                        message = "Invalid UUID string: not-a-uuid",
                    )
                    assertOperationError(
                        response = missingResponse,
                        operationName = "app",
                        message = "App not found.",
                    )
                }
            }
        }

        given("activateApp") {
            `when`("an admin activates a disabled app") {
                then("returns the enabled app and keeps the operation idempotent") {
                    val admin = bootstrapAdmin()
                    val appId = createFixtureApp(name = "docs", port = 8080, isEnabled = false)

                    val firstResponse = executeGraphqlAndRead(
                        activateAppRequest(appId.toString()),
                        accessToken = admin.accessToken,
                    )
                    val secondResponse = executeGraphqlAndRead(
                        activateAppRequest(appId.toString()),
                        accessToken = admin.accessToken,
                    )
                    val appResponse = executeGraphqlAndRead(
                        appRequest(appId.toString()),
                        accessToken = admin.accessToken,
                    )

                    firstResponse.textAt("/data/activateApp/id") shouldBe appId.toString()
                    firstResponse.at("/data/activateApp/isEnabled").asBoolean() shouldBe true
                    secondResponse.at("/data/activateApp/isEnabled").asBoolean() shouldBe true
                    appResponse.at("/data/app/isEnabled").asBoolean() shouldBe true
                }
            }
        }

        given("deactivateApp") {
            `when`("an admin deactivates an enabled app") {
                then("returns the disabled app and keeps the operation idempotent") {
                    val admin = bootstrapAdmin()
                    val appId = createFixtureApp(name = "docs", port = 8080, isEnabled = true)

                    val firstResponse = executeGraphqlAndRead(
                        deactivateAppRequest(appId.toString()),
                        accessToken = admin.accessToken,
                    )
                    val secondResponse = executeGraphqlAndRead(
                        deactivateAppRequest(appId.toString()),
                        accessToken = admin.accessToken,
                    )
                    val appResponse = executeGraphqlAndRead(
                        appRequest(appId.toString()),
                        accessToken = admin.accessToken,
                    )

                    firstResponse.textAt("/data/deactivateApp/id") shouldBe appId.toString()
                    firstResponse.at("/data/deactivateApp/isEnabled").asBoolean() shouldBe false
                    secondResponse.at("/data/deactivateApp/isEnabled").asBoolean() shouldBe false
                    appResponse.at("/data/app/isEnabled").asBoolean() shouldBe false
                }
            }

            `when`("the app id is invalid or missing") {
                then("returns the current parser and not found contracts") {
                    val admin = bootstrapAdmin()
                    val missingAppId = UUID.randomUUID().toString()

                    val invalidResponse = executeGraphqlAndReadAllowErrors(
                        deactivateAppRequest("not-a-uuid"),
                        accessToken = admin.accessToken,
                    )
                    val missingResponse = executeGraphqlAndReadAllowErrors(
                        deactivateAppRequest(missingAppId),
                        accessToken = admin.accessToken,
                    )

                    assertOperationError(
                        response = invalidResponse,
                        operationName = "deactivateApp",
                        message = "Invalid UUID string: not-a-uuid",
                    )
                    assertOperationError(
                        response = missingResponse,
                        operationName = "deactivateApp",
                        message = "App not found.",
                    )
                }
            }
        }

        given("admin-only app operations") {
            `when`("a non-admin calls app queries and mutations") {
                then("returns the shared forbidden contract") {
                    val member = bootstrapMember(
                        name = "App Reader",
                        email = "app-reader@example.com",
                        password = "member-password",
                    )
                    val appId = createFixtureApp(name = "docs", port = 8080)

                    val responses = listOf(
                        "apps" to executeGraphqlAndReadAllowErrors(
                            appsRequest(page = 0, size = 10),
                            accessToken = member.accessToken,
                        ),
                        "app" to executeGraphqlAndReadAllowErrors(
                            appRequest(appId.toString()),
                            accessToken = member.accessToken,
                        ),
                        "activateApp" to executeGraphqlAndReadAllowErrors(
                            activateAppRequest(appId.toString()),
                            accessToken = member.accessToken,
                        ),
                        "deactivateApp" to executeGraphqlAndReadAllowErrors(
                            deactivateAppRequest(appId.toString()),
                            accessToken = member.accessToken,
                        ),
                    )

                    responses.forEach { (operationName, response) ->
                        assertForbidden(response, operationName)
                    }
                }
            }
        }
    }

    private fun appsRequest(page: Int, size: Int): GraphQLQueryRequest {
        val projection = AppsProjectionRoot<Nothing, Nothing>()
        projection.pageInfo().page().size().totalElements().totalPages()
        projection.apps().id().name().port().isEnabled().createdDatetime()

        return GraphQLQueryRequest(
            AppsGraphQLQuery.newRequest()
                .page(page)
                .size(size)
                .build(),
            projection,
        )
    }

    private fun appRequest(id: String): GraphQLQueryRequest {
        val projection = AppProjectionRoot<Nothing, Nothing>()
        projection.id().name().port().isEnabled().createdDatetime()

        return GraphQLQueryRequest(
            AppGraphQLQuery.newRequest()
                .id(id)
                .build(),
            projection,
        )
    }

    private fun activateAppRequest(id: String): GraphQLQueryRequest {
        val projection = ActivateAppProjectionRoot<Nothing, Nothing>()
        projection.id().name().port().isEnabled().createdDatetime()

        return GraphQLQueryRequest(
            ActivateAppGraphQLQuery.newRequest()
                .input(
                    ActivateAppInput.newBuilder()
                        .id(id)
                        .build(),
                )
                .build(),
            projection,
        )
    }

    private fun deactivateAppRequest(id: String): GraphQLQueryRequest {
        val projection = DeactivateAppProjectionRoot<Nothing, Nothing>()
        projection.id().name().port().isEnabled().createdDatetime()

        return GraphQLQueryRequest(
            DeactivateAppGraphQLQuery.newRequest()
                .input(
                    DeactivateAppInput.newBuilder()
                        .id(id)
                        .build(),
                )
                .build(),
            projection,
        )
    }

    private fun createFixtureApp(
        name: String,
        port: Int = 8080,
        isEnabled: Boolean = true,
    ): UUID =
        appRepository.save(
            App(
                name = name,
                port = port,
                isEnabled = isEnabled,
            ),
        ).id

    private fun assertForbidden(response: JsonNode, operationName: String) {
        assertOperationError(
            response = response,
            operationName = operationName,
            message = "You do not have permission to perform this action.",
        )
    }

    private fun assertOperationError(
        response: JsonNode,
        operationName: String,
        message: String,
    ) {
        val operationNode = response.at("/data/$operationName")
        (operationNode.isMissingNode || operationNode.isNull) shouldBe true
        response.textAt("/errors/0/message") shouldBe message
        response.at("/errors/0/extensions").isMissingNode shouldBe true
    }
}
