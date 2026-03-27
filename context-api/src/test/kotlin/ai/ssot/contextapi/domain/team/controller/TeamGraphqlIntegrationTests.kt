package ai.ssot.contextapi.domain.team.controller

import ai.ssot.contextapi.GraphqlIntegrationTestSupport
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import kotlin.test.assertEquals

@SpringBootTest
@AutoConfigureMockMvc
class TeamGraphqlIntegrationTests : GraphqlIntegrationTestSupport() {
    @Test
    fun `manages team membership and nested member paging over graphql`() {
        val admin = bootstrapAdmin()
        val memberId = registerMember("Bob", "bob@example.com", "bob-password", admin.accessToken)
        val teamId = createTeam("Platform", admin.accessToken)

        executeGraphql(
            """
            mutation {
              addTeamMember(input: {
                teamId: $teamId
                memberId: $memberId
              }) {
                team {
                  id
                }
                member {
                  id
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.addTeamMember.team.id").value(teamId.toInt()))
            .andExpect(jsonPath("$.data.addTeamMember.member.id").value(memberId.toInt()))
            .andExpect(jsonPath("$.errors").doesNotExist())

        val teamResponse = executeGraphqlAndRead(
            """
            query {
              team(id: $teamId) {
                id
                name
                members {
                  id
                  email
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )

        assertEquals(teamId, teamResponse.longAt("/data/team/id"))
        assertEquals("Platform", teamResponse.textAt("/data/team/name"))
        assertEquals(1, teamResponse.at("/data/team/members").size())
        assertEquals("bob@example.com", teamResponse.textAt("/data/team/members/0/email"))

        executeGraphql(
            """
            mutation {
              removeTeamMember(input: {
                teamId: $teamId
                memberId: $memberId
              }) {
                team {
                  id
                }
                member {
                  id
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.errors").doesNotExist())

        executeGraphql(
            """
            mutation {
              deleteTeam(input: { id: $teamId })
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.deleteTeam").value(true))
            .andExpect(jsonPath("$.errors").doesNotExist())
    }

    @Test
    fun `rejects deleting non empty teams`() {
        val admin = bootstrapAdmin()
        val memberId = registerMember("Carol", "carol@example.com", "carol-password", admin.accessToken)
        val teamId = createTeam("Security", admin.accessToken)
        addTeamMember(teamId, memberId, admin.accessToken)

        executeGraphql(
            """
            mutation {
              deleteTeam(input: { id: $teamId })
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.deleteTeam").doesNotExist())
            .andExpect(jsonPath("$.errors[0].extensions.code").value("TEAM_NOT_EMPTY"))
    }

    @Test
    fun `returns membership errors through the shared graphql handler`() {
        val admin = bootstrapAdmin()
        val memberId = registerMember("Dana", "dana@example.com", "dana-password", admin.accessToken)
        val teamId = createTeam("Platform", admin.accessToken)

        addTeamMember(teamId, memberId, admin.accessToken)

        executeGraphql(
            """
            mutation {
              addTeamMember(input: {
                teamId: $teamId
                memberId: $memberId
              }) {
                member {
                  id
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.addTeamMember").doesNotExist())
            .andExpect(jsonPath("$.errors[0].extensions.code").value("MEMBERSHIP_ALREADY_EXISTS"))

        executeGraphql(
            """
            mutation {
              removeTeamMember(input: {
                teamId: $teamId
                memberId: 999999
              }) {
                member {
                  id
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.removeTeamMember").doesNotExist())
            .andExpect(jsonPath("$.errors[0].extensions.code").value("NOT_FOUND"))
    }

    private fun createTeam(name: String, accessToken: String): Long =
        executeGraphqlAndRead(
            """
            mutation {
              createTeam(input: { name: "$name" }) {
                id
              }
            }
            """.trimIndent(),
            accessToken,
        ).longAt("/data/createTeam/id")

    private fun addTeamMember(teamId: Long, memberId: Long, accessToken: String) {
        executeGraphql(
            """
            mutation {
              addTeamMember(input: {
                teamId: $teamId
                memberId: $memberId
              }) {
                member {
                  id
                }
              }
            }
            """.trimIndent(),
            accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.errors").doesNotExist())
    }
}
