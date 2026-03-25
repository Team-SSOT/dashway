package ai.ssot.contextapi

import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActions
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper

abstract class GraphqlIntegrationTestSupport : PostgresIntegrationTestSupport() {
    protected data class AuthSession(
        val memberId: Long,
        val accessToken: String,
        val refreshToken: String,
    )

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    protected lateinit var objectMapper: ObjectMapper

    protected fun executeGraphql(
        query: String,
        accessToken: String? = null,
    ): ResultActions =
        mockMvc.perform(
            post("/graphql")
                .apply {
                    if (accessToken != null) {
                        header("Authorization", "Bearer $accessToken")
                    }
                }
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mapOf("query" to query))),
        )

    protected fun executeGraphqlAndRead(
        query: String,
        accessToken: String? = null,
    ): JsonNode =
        executeGraphql(query, accessToken)
            .andExpect(status().isOk)
            .andReturn()
            .response
            .contentAsString
            .let(objectMapper::readTree)
            .also { response ->
                check(response.at("/errors").isMissingNode) {
                    response.toPrettyString()
                }
            }

    protected fun executeGraphqlAndReadAllowErrors(
        query: String,
        accessToken: String? = null,
    ): JsonNode =
        executeGraphql(query, accessToken)
            .andExpect(status().isOk)
            .andReturn()
            .response
            .contentAsString
            .let(objectMapper::readTree)

    protected fun JsonNode.textAt(pointer: String): String =
        at(pointer).toString().trim('"')

    protected fun JsonNode.longAt(pointer: String): Long =
        at(pointer).asLong()

    protected fun bootstrapAdmin(
        name: String = "Admin",
        email: String = "admin@example.com",
        password: String = "admin-password",
    ): AuthSession {
        val memberId = registerMember(
            name = name,
            email = email,
            password = password,
        )
        val session = login(email, password)
        return session.copy(memberId = memberId)
    }

    protected fun login(email: String, password: String): AuthSession =
        executeGraphqlAndRead(
            """
            mutation {
              login(input: {
                email: "$email"
                password: "$password"
              }) {
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
        ).let { response ->
            AuthSession(
                memberId = response.longAt("/data/login/member/id"),
                accessToken = response.textAt("/data/login/tokens/accessToken"),
                refreshToken = response.textAt("/data/login/tokens/refreshToken"),
            )
        }

    protected fun registerMember(
        name: String,
        email: String,
        password: String,
        accessToken: String? = null,
        admin: Boolean? = null,
        enabled: Boolean? = null,
    ): Long {
        val adminField = admin?.let { "\n                admin: $it" } ?: ""
        val enabledField = enabled?.let { "\n                enabled: $it" } ?: ""

        return executeGraphqlAndRead(
            """
            mutation {
              registerMember(input: {
                name: "$name"
                email: "$email"
                password: "$password"$adminField$enabledField
              }) {
                id
              }
            }
            """.trimIndent(),
            accessToken,
        ).longAt("/data/registerMember/id")
    }
}
