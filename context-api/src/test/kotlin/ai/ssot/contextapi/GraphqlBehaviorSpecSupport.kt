package ai.ssot.contextapi

import ai.ssot.contextapi.domain.auth.entity.MemberAuthority
import ai.ssot.contextapi.domain.auth.entity.MemberAuthorityId
import ai.ssot.contextapi.domain.auth.repository.AuthorityRepository
import ai.ssot.contextapi.domain.auth.repository.MemberAuthorityRepository
import ai.ssot.contextapi.domain.auth.repository.TokenRepository
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import ai.ssot.contextapi.domain.team.entity.Team
import ai.ssot.contextapi.domain.team.entity.TeamMember
import ai.ssot.contextapi.domain.team.entity.TeamMemberId
import ai.ssot.contextapi.domain.team.repository.TeamMemberRepository
import ai.ssot.contextapi.domain.team.repository.TeamRepository
import ai.ssot.contextapi.security.token.TokenService
import com.netflix.graphql.dgs.client.codegen.GraphQLQueryRequest
import jakarta.servlet.http.Cookie
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.ResultActions
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.util.UUID

abstract class GraphqlBehaviorSpecSupport : PostgresBehaviorSpecSupport() {
    protected data class AuthSession(
        val memberId: Long,
        val accessToken: String,
        val refreshToken: String,
        val refreshCookieHeader: String,
    )

    @Autowired
    protected lateinit var mockMvc: MockMvc

    @Autowired
    protected lateinit var objectMapper: ObjectMapper

    @Autowired
    protected lateinit var authorityRepository: AuthorityRepository

    @Autowired
    protected lateinit var memberAuthorityRepository: MemberAuthorityRepository

    @Autowired
    protected lateinit var memberRepository: MemberRepository

    @Autowired
    protected lateinit var passwordEncoder: PasswordEncoder

    @Autowired
    protected lateinit var tokenRepository: TokenRepository

    @Autowired
    protected lateinit var tokenService: TokenService

    @Autowired
    protected lateinit var teamMemberRepository: TeamMemberRepository

    @Autowired
    protected lateinit var teamRepository: TeamRepository

    protected fun executeGraphql(
        query: String,
        accessToken: String? = null,
        cookies: Array<out Cookie> = emptyArray(),
    ): ResultActions =
        mockMvc.perform(
            post("/graphql")
                .apply {
                    if (accessToken != null) {
                        header("Authorization", "Bearer $accessToken")
                    }
                    if (cookies.isNotEmpty()) {
                        cookie(*cookies)
                    }
                }
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mapOf("query" to query))),
        )

    protected fun executeGraphql(
        request: GraphQLQueryRequest,
        accessToken: String? = null,
        cookies: Array<out Cookie> = emptyArray(),
    ): ResultActions = executeGraphql(request.serialize(), accessToken, cookies)

    protected fun executeGraphqlAndRead(
        query: String,
        accessToken: String? = null,
        cookies: Array<out Cookie> = emptyArray(),
    ): JsonNode =
        executeGraphql(query, accessToken, cookies)
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

    protected fun executeGraphqlAndRead(
        request: GraphQLQueryRequest,
        accessToken: String? = null,
        cookies: Array<out Cookie> = emptyArray(),
    ): JsonNode = executeGraphqlAndRead(request.serialize(), accessToken, cookies)

    protected fun executeGraphqlAndReadAllowErrors(
        query: String,
        accessToken: String? = null,
        cookies: Array<out Cookie> = emptyArray(),
    ): JsonNode =
        executeGraphql(query, accessToken, cookies)
            .andExpect(status().isOk)
            .andReturn()
            .response
            .contentAsString
            .let(objectMapper::readTree)

    protected fun executeGraphqlAndReadAllowErrors(
        request: GraphQLQueryRequest,
        accessToken: String? = null,
        cookies: Array<out Cookie> = emptyArray(),
    ): JsonNode = executeGraphqlAndReadAllowErrors(request.serialize(), accessToken, cookies)

    protected fun JsonNode.textAt(pointer: String): String =
        at(pointer).toString().trim('"')

    protected fun JsonNode.longAt(pointer: String): Long =
        at(pointer).asLong()

    protected fun refreshTokenCookie(refreshToken: String): Cookie =
        Cookie(TokenService.REFRESH_TOKEN_HEADER, refreshToken)

    protected fun extractCookieValue(
        setCookieHeader: String,
        cookieName: String,
    ): String =
        setCookieHeader
            .substringBefore(";")
            .takeIf { it.startsWith("$cookieName=") }
            ?.substringAfter("=")
            ?.takeIf { it.isNotBlank() }
            ?: error("Cookie $cookieName not found in header: $setCookieHeader")

    protected fun bootstrapAdmin(
        name: String = "Admin",
        email: String = "admin@example.com",
        password: String = "admin-password",
    ): AuthSession {
        val memberId = seedMember(
            name = name,
            email = email,
            password = password,
            authorityIds = listOf(1),
        )
        return issueSession(memberId, listOf(1))
    }

    protected fun bootstrapMember(
        name: String = "Member",
        email: String = "member@example.com",
        password: String = "member-password",
    ): AuthSession {
        val memberId = seedMember(
            name = name,
            email = email,
            password = password,
            authorityIds = listOf(3),
        )
        return issueSession(memberId, listOf(3))
    }

    protected fun registerMember(
        name: String,
        email: String,
        password: String,
        accessToken: String? = null,
        authorityIds: List<Int> = listOf(3),
        isEnabled: Boolean = true,
    ): Long {
        val teamId = createFixtureTeam()
        val authoritiesField = authorityIds.joinToString(
            prefix = "\n                authorityIds: [",
            postfix = "]",
        ) { it.toString() }

        return executeGraphqlAndRead(
            """
            mutation {
              registerMember(input: {
                name: "$name"
                email: "$email"
                password: "$password"
                isEnabled: $isEnabled
                teamId: $teamId$authoritiesField
              }) {
                id
              }
            }
            """.trimIndent(),
            accessToken,
        ).longAt("/data/registerMember/id")
    }

    protected fun createFixtureTeam(name: String = "team-${UUID.randomUUID()}"): Long =
        checkNotNull(teamRepository.save(Team(name = name)).id)

    private fun issueSession(memberId: Long, authorityIds: List<Int>): AuthSession {
        val roles = authorityRepository.findAllById(authorityIds)
            .map { it.name }
        val (accessToken, refreshToken) = tokenService.generateTokens(memberId, roles)

        tokenRepository.saveRefreshToken(
            memberId = memberId,
            refreshToken = refreshToken,
            ttlSeconds = tokenService.getTtl(refreshToken),
        )

        return AuthSession(
            memberId = memberId,
            accessToken = accessToken,
            refreshToken = refreshToken,
            refreshCookieHeader = "${TokenService.REFRESH_TOKEN_HEADER}=$refreshToken",
        )
    }

    protected fun seedMember(
        name: String,
        email: String,
        password: String,
        authorityIds: List<Int>,
        isEnabled: Boolean = true,
    ): Long {
        val memberId = checkNotNull(
            memberRepository.save(
                Member(
                    name = name,
                    email = email,
                    password = requireNotNull(passwordEncoder.encode(password)),
                    isEnabled = isEnabled,
                ),
            ).id,
        )
        val authoritiesById = authorityRepository.findAllById(authorityIds)
            .associateBy { checkNotNull(it.id) }

        memberAuthorityRepository.saveAll(
            authorityIds.distinct().map { authorityId ->
                MemberAuthority(
                    id = MemberAuthorityId(
                        memberId = memberId,
                        authorityId = checkNotNull(authoritiesById[authorityId]).id!!,
                    ),
                )
            },
        )
        teamMemberRepository.save(
            TeamMember(
                id = TeamMemberId(
                    teamId = createFixtureTeam(),
                    memberId = memberId,
                ),
            ),
        )

        return memberId
    }
}
