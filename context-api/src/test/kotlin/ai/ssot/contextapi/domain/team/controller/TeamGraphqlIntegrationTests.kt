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
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.addTeamMember.team.id").value(teamId.toInt()))
            .andExpect(jsonPath("$.data.addTeamMember.member.id").value(memberId.toInt()))
            .andExpect(jsonPath("$.data.addTeamMember.errors").isEmpty())

        val teamResponse = executeGraphqlAndRead(
            """
            query {
              team(id: $teamId) {
                id
                name
                members(page: 0, size: 10) {
                  totalElements
                  items {
                    id
                    email
                  }
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )

        assertEquals(teamId, teamResponse.longAt("/data/team/id"))
        assertEquals("Platform", teamResponse.textAt("/data/team/name"))
        assertEquals(1, teamResponse.at("/data/team/members/totalElements").asInt())
        assertEquals("bob@example.com", teamResponse.textAt("/data/team/members/items/0/email"))

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
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.removeTeamMember.errors").isEmpty())

        executeGraphql(
            """
            mutation {
              deleteTeam(input: { id: $teamId }) {
                deleted
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.deleteTeam.deleted").value(true))
            .andExpect(jsonPath("$.data.deleteTeam.errors").isEmpty())
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
              deleteTeam(input: { id: $teamId }) {
                deleted
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.deleteTeam.deleted").value(false))
            .andExpect(jsonPath("$.data.deleteTeam.errors[0].code").value("TEAM_NOT_EMPTY"))
    }

    @Test
    fun `returns membership errors through the shared mutation handler`() {
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
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.addTeamMember.member").doesNotExist())
            .andExpect(jsonPath("$.data.addTeamMember.errors[0].code").value("MEMBERSHIP_ALREADY_EXISTS"))

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
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.removeTeamMember.member").doesNotExist())
            .andExpect(jsonPath("$.data.removeTeamMember.errors[0].code").value("NOT_FOUND"))
    }

    private fun createTeam(name: String, accessToken: String): Long =
        executeGraphqlAndRead(
            """
            mutation {
              createTeam(input: { name: "$name" }) {
                team {
                  id
                }
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            accessToken,
        ).longAt("/data/createTeam/team/id")

    private fun addTeamMember(teamId: Long, memberId: Long, accessToken: String) {
        executeGraphql(
            """
            mutation {
              addTeamMember(input: {
                teamId: $teamId
                memberId: $memberId
              }) {
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.addTeamMember.errors").isEmpty())
    }
}
