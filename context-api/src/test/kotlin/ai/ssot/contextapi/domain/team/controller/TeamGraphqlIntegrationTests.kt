package ai.ssot.contextapi.domain.team.controller

import ai.ssot.contextapi.GraphqlBehaviorSpecSupport
import ai.ssot.contextapi.generated.client.AddTeamMemberGraphQLQuery
import ai.ssot.contextapi.generated.client.AddTeamMemberProjectionRoot
import ai.ssot.contextapi.generated.client.CreateTeamGraphQLQuery
import ai.ssot.contextapi.generated.client.CreateTeamProjectionRoot
import ai.ssot.contextapi.generated.client.DeleteTeamGraphQLQuery
import ai.ssot.contextapi.generated.client.RemoveTeamMemberGraphQLQuery
import ai.ssot.contextapi.generated.client.RemoveTeamMemberProjectionRoot
import ai.ssot.contextapi.generated.client.TeamGraphQLQuery
import ai.ssot.contextapi.generated.client.TeamProjectionRoot
import ai.ssot.contextapi.generated.client.TeamsGraphQLQuery
import ai.ssot.contextapi.generated.client.TeamsProjectionRoot
import ai.ssot.contextapi.generated.client.UpdateTeamGraphQLQuery
import ai.ssot.contextapi.generated.client.UpdateTeamProjectionRoot
import ai.ssot.contextapi.generated.types.AddTeamMemberInput
import ai.ssot.contextapi.generated.types.CreateTeamInput
import ai.ssot.contextapi.generated.types.DeleteTeamInput
import ai.ssot.contextapi.generated.types.RemoveTeamMemberInput
import ai.ssot.contextapi.generated.types.UpdateTeamInput
import com.netflix.graphql.dgs.client.codegen.GraphQLQueryRequest
import io.kotest.matchers.shouldBe
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import tools.jackson.databind.JsonNode

@SpringBootTest
@AutoConfigureMockMvc
class TeamGraphqlIntegrationTests : GraphqlBehaviorSpecSupport() {
    init {
        given("teams") {
            `when`("teams exist and paging is valid") {
                then("lists newest teams first with page info") {
                    val admin = bootstrapAdmin()
                    val platformId = createTeam("Platform", admin.accessToken)
                    val securityId = createTeam("Security", admin.accessToken)

                    val response = executeGraphqlAndRead(
                        teamsRequest(page = 0, size = 10),
                        accessToken = admin.accessToken,
                    )
                    val returnedTeams = response.at("/data/teams/teams")

                    response.longAt("/data/teams/pageInfo/page") shouldBe 0L
                    response.longAt("/data/teams/pageInfo/size") shouldBe 10L
                    response.longAt("/data/teams/pageInfo/totalElements") shouldBe returnedTeams.size().toLong()
                    response.longAt("/data/teams/pageInfo/totalPages") shouldBe 1L
                    response.longAt("/data/teams/teams/0/id") shouldBe securityId
                    response.longAt("/data/teams/teams/1/id") shouldBe platformId
                    response.textAt("/data/teams/teams/0/name") shouldBe "Security"
                    response.textAt("/data/teams/teams/1/name") shouldBe "Platform"
                }
            }

            `when`("paging is invalid") {
                then("returns validation messages without custom extensions") {
                    val admin = bootstrapAdmin()
                    val responses = listOf(
                        executeGraphqlAndReadAllowErrors(
                            teamsRequest(page = -1, size = 10),
                            accessToken = admin.accessToken,
                        ) to "page must be 0 or greater.",
                        executeGraphqlAndReadAllowErrors(
                            teamsRequest(page = 0, size = 0),
                            accessToken = admin.accessToken,
                        ) to "size must be between 1 and 100.",
                    )

                    responses.forEach { (response, message) ->
                        val teamsNode = response.at("/data/teams")
                        (teamsNode.isMissingNode || teamsNode.isNull) shouldBe true
                        response.textAt("/errors/0/message") shouldBe message
                        response.at("/errors/0/extensions").isMissingNode shouldBe true
                    }
                }
            }
        }

        given("createTeam") {
            `when`("an admin provides a valid name") {
                then("creates the team with a trimmed name") {
                    val admin = bootstrapAdmin()

                    val response = executeGraphqlAndRead(
                        createTeamRequest(" Platform "),
                        accessToken = admin.accessToken,
                    )

                    response.textAt("/data/createTeam/name") shouldBe "Platform"
                }
            }

            `when`("the name is blank") {
                then("returns a validation error with field information") {
                    val admin = bootstrapAdmin()

                    val response = executeGraphqlAndReadAllowErrors(
                        createTeamRequest("   "),
                        accessToken = admin.accessToken,
                    )

                    assertFieldValidationError(
                        response = response,
                        operationName = "createTeam",
                        message = "name is required.",
                        field = "name",
                    )
                }
            }

            `when`("a non-admin calls the mutation") {
                then("returns the shared forbidden contract") {
                    val member = bootstrapMember(
                        name = "Member User",
                        email = "member-user@example.com",
                        password = "member-password",
                    )

                    val response = executeGraphqlAndReadAllowErrors(
                        createTeamRequest("Restricted"),
                        accessToken = member.accessToken,
                    )

                    assertForbidden(response, "createTeam")
                }
            }
        }

        given("updateTeam") {
            `when`("an admin updates an existing team") {
                then("persists the trimmed team name") {
                    val admin = bootstrapAdmin()
                    val teamId = createTeam("Platform", admin.accessToken)

                    val updateResponse = executeGraphqlAndRead(
                        updateTeamRequest(teamId, " Platform Core "),
                        accessToken = admin.accessToken,
                    )
                    val teamResponse = executeGraphqlAndRead(
                        teamRequest(teamId),
                        accessToken = admin.accessToken,
                    )

                    updateResponse.textAt("/data/updateTeam/name") shouldBe "Platform Core"
                    teamResponse.textAt("/data/team/name") shouldBe "Platform Core"
                }
            }

            `when`("the team does not exist") {
                then("returns the not found contract") {
                    val admin = bootstrapAdmin()

                    val response = executeGraphqlAndReadAllowErrors(
                        updateTeamRequest(999_999L, "Ghost Team"),
                        accessToken = admin.accessToken,
                    )

                    assertOperationError(
                        response = response,
                        operationName = "updateTeam",
                        message = "Team(999999) not found.",
                    )
                }
            }

            `when`("the updated name is blank") {
                then("returns a validation error with field information") {
                    val admin = bootstrapAdmin()
                    val teamId = createTeam("Platform", admin.accessToken)

                    val response = executeGraphqlAndReadAllowErrors(
                        updateTeamRequest(teamId, "   "),
                        accessToken = admin.accessToken,
                    )

                    assertFieldValidationError(
                        response = response,
                        operationName = "updateTeam",
                        message = "name is required.",
                        field = "name",
                    )
                }
            }
        }

        given("team") {
            `when`("the team contains enabled and disabled members") {
                then("returns only enabled members with authority objects") {
                    val admin = bootstrapAdmin()
                    val enabledMember = bootstrapMember(
                        name = "Enabled User",
                        email = "enabled-user@example.com",
                        password = "enabled-password",
                    )
                    val disabledMemberId = seedMember(
                        name = "Disabled User",
                        email = "disabled-user@example.com",
                        password = "disabled-password",
                        authorityIds = listOf(3),
                        isEnabled = false,
                    )
                    val teamId = createTeam("Platform", admin.accessToken)

                    executeGraphqlAndRead(
                        addTeamMemberRequest(teamId, enabledMember.memberId),
                        accessToken = admin.accessToken,
                    )
                    executeGraphqlAndRead(
                        addTeamMemberRequest(teamId, disabledMemberId),
                        accessToken = admin.accessToken,
                    )

                    val response = executeGraphqlAndRead(
                        teamRequest(teamId),
                        accessToken = admin.accessToken,
                    )

                    response.longAt("/data/team/id") shouldBe teamId
                    response.textAt("/data/team/name") shouldBe "Platform"
                    response.at("/data/team/members").size() shouldBe 1
                    response.longAt("/data/team/members/0/id") shouldBe enabledMember.memberId
                    response.textAt("/data/team/members/0/name") shouldBe "Enabled User"
                    response.textAt("/data/team/members/0/email") shouldBe "enabled-user@example.com"
                    response.at("/data/team/members/0/isEnabled").asBoolean() shouldBe true
                    response.longAt("/data/team/members/0/authorities/0/id") shouldBe 3L
                    response.textAt("/data/team/members/0/authorities/0/name") shouldBe "MEMBER"
                }
            }
        }

        given("team membership mutations") {
            `when`("an admin manages team membership") {
                then("adds and removes members before deleting the team") {
                    val admin = bootstrapAdmin()
                    val member = bootstrapMember(
                        name = "Bob",
                        email = "bob@example.com",
                        password = "bob-password",
                    )
                    val teamId = createTeam("Platform", admin.accessToken)

                    val addResponse = executeGraphqlAndRead(
                        addTeamMemberRequest(teamId, member.memberId),
                        accessToken = admin.accessToken,
                    )
                    val removeResponse = executeGraphqlAndRead(
                        removeTeamMemberRequest(teamId, member.memberId),
                        accessToken = admin.accessToken,
                    )
                    val deleteResponse = executeGraphqlAndRead(
                        deleteTeamRequest(teamId),
                        accessToken = admin.accessToken,
                    )

                    addResponse.longAt("/data/addTeamMember/team/id") shouldBe teamId
                    addResponse.longAt("/data/addTeamMember/member/id") shouldBe member.memberId
                    addResponse.textAt("/data/addTeamMember/member/authorities/0/name") shouldBe "MEMBER"
                    removeResponse.longAt("/data/removeTeamMember/team/id") shouldBe teamId
                    removeResponse.longAt("/data/removeTeamMember/member/id") shouldBe member.memberId
                    deleteResponse.at("/data/deleteTeam").asBoolean() shouldBe true
                }
            }

            `when`("an admin adds a duplicate membership") {
                then("returns the shared duplicate membership error") {
                    val admin = bootstrapAdmin()
                    val member = bootstrapMember(
                        name = "Dana",
                        email = "dana@example.com",
                        password = "dana-password",
                    )
                    val teamId = createTeam("Platform", admin.accessToken)

                    executeGraphqlAndRead(
                        addTeamMemberRequest(teamId, member.memberId),
                        accessToken = admin.accessToken,
                    )

                    val response = executeGraphqlAndReadAllowErrors(
                        addTeamMemberRequest(teamId, member.memberId),
                        accessToken = admin.accessToken,
                    )

                    assertOperationError(
                        response = response,
                        operationName = "addTeamMember",
                        message = "Member(${member.memberId}) is already assigned to the team($teamId).",
                    )
                }
            }

            `when`("an admin removes a membership that does not exist") {
                then("returns the shared membership not found error") {
                    val admin = bootstrapAdmin()
                    val teamId = createTeam("Platform", admin.accessToken)

                    val response = executeGraphqlAndReadAllowErrors(
                        removeTeamMemberRequest(teamId, 999_999L),
                        accessToken = admin.accessToken,
                    )

                    assertOperationError(
                        response = response,
                        operationName = "removeTeamMember",
                        message = "Member(999999) is not assigned to the team($teamId).",
                    )
                }
            }

            `when`("an admin deletes a non-empty team") {
                then("rejects the request") {
                    val admin = bootstrapAdmin()
                    val member = bootstrapMember(
                        name = "Carol",
                        email = "carol@example.com",
                        password = "carol-password",
                    )
                    val teamId = createTeam("Security", admin.accessToken)

                    executeGraphqlAndRead(
                        addTeamMemberRequest(teamId, member.memberId),
                        accessToken = admin.accessToken,
                    )

                    val response = executeGraphqlAndReadAllowErrors(
                        deleteTeamRequest(teamId),
                        accessToken = admin.accessToken,
                    )

                    assertOperationError(
                        response = response,
                        operationName = "deleteTeam",
                        message = "Remove all team members before deleting the team($teamId).",
                    )
                }
            }

            `when`("a non-admin calls admin-only team mutations") {
                then("rejects create, update, delete, add, and remove") {
                    val admin = bootstrapAdmin()
                    val member = bootstrapMember(
                        name = "Reader",
                        email = "reader@example.com",
                        password = "reader-password",
                    )
                    val targetMemberId = seedMember(
                        name = "Managed User",
                        email = "managed-user@example.com",
                        password = "managed-password",
                        authorityIds = listOf(3),
                    )
                    val teamId = createTeam("Platform", admin.accessToken)

                    executeGraphqlAndRead(
                        addTeamMemberRequest(teamId, targetMemberId),
                        accessToken = admin.accessToken,
                    )

                    val responses = listOf(
                        "createTeam" to executeGraphqlAndReadAllowErrors(
                            createTeamRequest("Forbidden Team"),
                            accessToken = member.accessToken,
                        ),
                        "updateTeam" to executeGraphqlAndReadAllowErrors(
                            updateTeamRequest(teamId, "Forbidden Update"),
                            accessToken = member.accessToken,
                        ),
                        "deleteTeam" to executeGraphqlAndReadAllowErrors(
                            deleteTeamRequest(teamId),
                            accessToken = member.accessToken,
                        ),
                        "addTeamMember" to executeGraphqlAndReadAllowErrors(
                            addTeamMemberRequest(teamId, member.memberId),
                            accessToken = member.accessToken,
                        ),
                        "removeTeamMember" to executeGraphqlAndReadAllowErrors(
                            removeTeamMemberRequest(teamId, targetMemberId),
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

    private fun createTeam(name: String, accessToken: String): Long =
        executeGraphqlAndRead(
            createTeamRequest(name),
            accessToken = accessToken,
        ).longAt("/data/createTeam/id")

    private fun teamsRequest(page: Int, size: Int): GraphQLQueryRequest {
        val projection = TeamsProjectionRoot<Nothing, Nothing>()
        projection.pageInfo().page().size().totalElements().totalPages()
        projection.teams().id().name().createdDatetime()

        return GraphQLQueryRequest(
            TeamsGraphQLQuery.newRequest()
                .page(page)
                .size(size)
                .build(),
            projection,
        )
    }

    private fun teamRequest(id: Long): GraphQLQueryRequest {
        val projection = TeamProjectionRoot<Nothing, Nothing>()
        projection.id().name().createdDatetime()
        projection.members().id().name().email().isEnabled().authorities().id().name()

        return GraphQLQueryRequest(
            TeamGraphQLQuery.newRequest()
                .id(id)
                .build(),
            projection,
        )
    }

    private fun createTeamRequest(name: String): GraphQLQueryRequest {
        val projection = CreateTeamProjectionRoot<Nothing, Nothing>()
        projection.id().name().createdDatetime()

        return GraphQLQueryRequest(
            CreateTeamGraphQLQuery.newRequest()
                .input(
                    CreateTeamInput.newBuilder()
                        .name(name)
                        .build(),
                )
                .build(),
            projection,
        )
    }

    private fun updateTeamRequest(id: Long, name: String): GraphQLQueryRequest {
        val projection = UpdateTeamProjectionRoot<Nothing, Nothing>()
        projection.id().name().createdDatetime()

        return GraphQLQueryRequest(
            UpdateTeamGraphQLQuery.newRequest()
                .input(
                    UpdateTeamInput.newBuilder()
                        .id(id)
                        .name(name)
                        .build(),
                )
                .build(),
            projection,
        )
    }

    private fun deleteTeamRequest(id: Long): GraphQLQueryRequest =
        GraphQLQueryRequest(
            DeleteTeamGraphQLQuery.newRequest()
                .input(
                    DeleteTeamInput.newBuilder()
                        .id(id)
                        .build(),
                )
                .build(),
            null,
        )

    private fun addTeamMemberRequest(teamId: Long, memberId: Long): GraphQLQueryRequest {
        val projection = AddTeamMemberProjectionRoot<Nothing, Nothing>()
        projection.team().id().name()
        projection.member().id().email().authorities().id().name()

        return GraphQLQueryRequest(
            AddTeamMemberGraphQLQuery.newRequest()
                .input(
                    AddTeamMemberInput.newBuilder()
                        .teamId(teamId)
                        .memberId(memberId)
                        .build(),
                )
                .build(),
            projection,
        )
    }

    private fun removeTeamMemberRequest(teamId: Long, memberId: Long): GraphQLQueryRequest {
        val projection = RemoveTeamMemberProjectionRoot<Nothing, Nothing>()
        projection.team().id().name()
        projection.member().id().email().authorities().id().name()

        return GraphQLQueryRequest(
            RemoveTeamMemberGraphQLQuery.newRequest()
                .input(
                    RemoveTeamMemberInput.newBuilder()
                        .teamId(teamId)
                        .memberId(memberId)
                        .build(),
                )
                .build(),
            projection,
        )
    }

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

    private fun assertFieldValidationError(
        response: JsonNode,
        operationName: String,
        message: String,
        field: String,
    ) {
        val operationNode = response.at("/data/$operationName")
        (operationNode.isMissingNode || operationNode.isNull) shouldBe true
        response.textAt("/errors/0/message") shouldBe message
        response.textAt("/errors/0/extensions/violations/0/field") shouldBe field
    }
}
