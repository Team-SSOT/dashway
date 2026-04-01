package ai.ssot.contextapi.domain.auth.controller

import ai.ssot.contextapi.GraphqlBehaviorSpecSupport
import ai.ssot.contextapi.generated.client.LoginGraphQLQuery
import ai.ssot.contextapi.generated.client.LoginProjectionRoot
import ai.ssot.contextapi.generated.client.LogoutGraphQLQuery
import ai.ssot.contextapi.generated.client.RefreshGraphQLQuery
import ai.ssot.contextapi.generated.client.RefreshProjectionRoot
import ai.ssot.contextapi.generated.types.LoginInput
import ai.ssot.contextapi.security.token.TokenService
import com.netflix.graphql.dgs.client.codegen.GraphQLQueryRequest
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.kotest.matchers.string.shouldNotBeBlank
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.web.server.LocalServerPort
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.util.UUID

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class AuthGraphqlIntegrationTests : GraphqlBehaviorSpecSupport() {
    @LocalServerPort
    private var port: Int = 0

    init {
        given("login") {
            `when`("valid admin credentials are provided") {
                then("returns an access token in the body and a refresh token cookie") {
                    bootstrapAdmin()

                    val response = executeAuthGraphql(
                        loginRequest(
                            email = "admin@example.com",
                            password = "admin-password",
                        ),
                    )
                    val setCookie = response.headers.getFirst(HttpHeaders.SET_COOKIE).orEmpty()

                    response.body.textAt("/data/login/member/email") shouldBe "admin@example.com"
                    response.body.textAt("/data/login/tokens/accessToken").shouldNotBeBlank()
                    response.body.at("/data/login/tokens/refreshToken").isMissingNode shouldBe true
                    response.body.at("/errors").isMissingNode shouldBe true
                    setCookie.shouldContain("${TokenService.REFRESH_TOKEN_HEADER}=")
                    setCookie.shouldContain("HttpOnly")
                    setCookie.shouldContain("Secure")
                    setCookie.shouldContain("SameSite=None")
                    setCookie.shouldContain("Path=/graphql")
                    setCookie.shouldContain("Max-Age=")
                }
            }

            `when`("invalid credentials are provided") {
                then("returns the shared login failure contract") {
                    bootstrapAdmin()

                    val response = executeAuthGraphql(
                        loginRequest(
                            email = "admin@example.com",
                            password = "wrong-password",
                        ),
                    ).body

                    val loginNode = response.at("/data/login")
                    (loginNode.isMissingNode || loginNode.isNull) shouldBe true
                    response.textAt("/errors/0/message") shouldBe "Invalid email or password."
                    response.at("/errors/0/extensions").isMissingNode shouldBe true
                }
            }

            `when`("the member is disabled") {
                then("returns the same login failure contract") {
                    val disabledEmail = "disabled-${UUID.randomUUID()}@example.com"
                    seedMember(
                        name = "Disabled User",
                        email = disabledEmail,
                        password = "disabled-password",
                        authorityIds = listOf(3),
                        isEnabled = false,
                    )

                    val response = executeAuthGraphql(
                        loginRequest(
                            email = disabledEmail,
                            password = "disabled-password",
                        ),
                    ).body

                    val loginNode = response.at("/data/login")
                    (loginNode.isMissingNode || loginNode.isNull) shouldBe true
                    response.textAt("/errors/0/message") shouldBe "Invalid email or password."
                    response.at("/errors/0/extensions").isMissingNode shouldBe true
                }
            }
        }

        given("refresh") {
            `when`("a valid refresh cookie is provided") {
                then("reissues the access token and sets a refresh token cookie") {
                    val admin = bootstrapAdmin()

                    val refreshResponse = executeAuthGraphql(
                        refreshRequest(),
                        refreshToken = admin.refreshToken,
                    )
                    val rotatedCookieHeader = refreshResponse.headers.getFirst(HttpHeaders.SET_COOKIE).orEmpty()
                    val rotatedRefreshToken = extractCookieValue(rotatedCookieHeader, TokenService.REFRESH_TOKEN_HEADER)

                    refreshResponse.body.longAt("/data/refresh/member/id") shouldBe admin.memberId
                    refreshResponse.body.textAt("/data/refresh/member/email") shouldBe "admin@example.com"
                    refreshResponse.body.textAt("/data/refresh/tokens/accessToken").shouldNotBeBlank()
                    refreshResponse.body.at("/data/refresh/tokens/refreshToken").isMissingNode shouldBe true
                    rotatedRefreshToken.shouldNotBeBlank()
                }
            }

            `when`("the refresh cookie is missing or blank") {
                then("rejects the request with the shared invalid refresh token contract") {
                    bootstrapAdmin()

                    val missingCookieResponse = executeAuthGraphql(
                        refreshRequest(),
                    ).body
                    val blankCookieResponse = executeAuthGraphql(
                        refreshRequest(),
                        refreshToken = "   ",
                    ).body

                    listOf(missingCookieResponse, blankCookieResponse).forEach { response ->
                        val refreshNode = response.at("/data/refresh")
                        (refreshNode.isMissingNode || refreshNode.isNull) shouldBe true
                        response.textAt("/errors/0/message") shouldBe "Refresh token is invalid or expired."
                        response.at("/errors/0/extensions").isMissingNode shouldBe true
                    }
                }
            }
        }

        given("logout") {
            `when`("the authenticated member provides both access token and refresh cookie") {
                then("revokes the session and rejects subsequent refresh requests") {
                    val admin = bootstrapAdmin()

                    val logoutPayload = executeAuthGraphql(
                        logoutRequest(),
                        accessToken = admin.accessToken,
                        refreshToken = admin.refreshToken,
                    ).body

                    logoutPayload.at("/data/logout").asBoolean() shouldBe true

                    val refreshAfterLogoutResponse = executeAuthGraphql(
                        refreshRequest(),
                        refreshToken = admin.refreshToken,
                    ).body

                    val refreshNode = refreshAfterLogoutResponse.at("/data/refresh")
                    (refreshNode.isMissingNode || refreshNode.isNull) shouldBe true
                    refreshAfterLogoutResponse.textAt("/errors/0/message") shouldBe "Refresh token is invalid or expired."
                }
            }
        }
    }

    private data class GraphqlHttpResponse(
        val body: tools.jackson.databind.JsonNode,
        val headers: HttpHeaders,
    )

    private val httpClient: HttpClient = HttpClient.newHttpClient()

    private fun executeAuthGraphql(
        request: GraphQLQueryRequest,
        accessToken: String? = null,
        refreshToken: String? = null,
    ): GraphqlHttpResponse {
        val requestBuilder = HttpRequest.newBuilder()
            .uri(URI.create("http://localhost:$port/graphql"))
            .header(HttpHeaders.CONTENT_TYPE, "application/json")
            .POST(
                HttpRequest.BodyPublishers.ofString(
                    objectMapper.writeValueAsString(
                        mapOf("query" to request.serialize()),
                    ),
                ),
            )

        if (accessToken != null) {
            requestBuilder.header(HttpHeaders.AUTHORIZATION, "Bearer $accessToken")
        }
        if (refreshToken != null) {
            requestBuilder.header(HttpHeaders.COOKIE, "${TokenService.REFRESH_TOKEN_HEADER}=$refreshToken")
        }

        val response = httpClient.send(
            requestBuilder.build(),
            HttpResponse.BodyHandlers.ofString(),
        )

        response.statusCode() shouldBe HttpStatus.OK.value()

        val responseHeaders = HttpHeaders()
        response.headers().map().forEach { (name, values) ->
            values.forEach { value -> responseHeaders.add(name, value) }
        }

        return GraphqlHttpResponse(
            body = objectMapper.readTree(response.body()),
            headers = responseHeaders,
        )
    }

    private fun loginRequest(
        email: String,
        password: String,
    ): GraphQLQueryRequest {
        val projection = LoginProjectionRoot<Nothing, Nothing>()
        projection.member().id().email()
        projection.tokens().accessToken()

        return GraphQLQueryRequest(
            LoginGraphQLQuery.newRequest()
                .input(
                    LoginInput.newBuilder()
                        .email(email)
                        .password(password)
                        .build(),
                )
                .build(),
            projection,
        )
    }

    private fun refreshRequest(): GraphQLQueryRequest {
        val projection = RefreshProjectionRoot<Nothing, Nothing>()
        projection.member().id().email()
        projection.tokens().accessToken()

        return GraphQLQueryRequest(
            RefreshGraphQLQuery.newRequest().build(),
            projection,
        )
    }

    private fun logoutRequest(): GraphQLQueryRequest =
        GraphQLQueryRequest(
            LogoutGraphQLQuery.newRequest().build(),
            null,
        )
}
