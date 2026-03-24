package ai.ssot.contextapi.domain.team.controller

import ai.ssot.contextapi.domain.team.dto.AddTeamMemberInput
import ai.ssot.contextapi.domain.team.dto.AddTeamMemberPayload
import ai.ssot.contextapi.domain.team.dto.CreateTeamInput
import ai.ssot.contextapi.domain.team.dto.CreateTeamPayload
import ai.ssot.contextapi.domain.team.dto.DeleteTeamInput
import ai.ssot.contextapi.domain.team.dto.DeleteTeamPayload
import ai.ssot.contextapi.domain.team.dto.MemberPage
import ai.ssot.contextapi.domain.team.dto.RemoveTeamMemberInput
import ai.ssot.contextapi.domain.team.dto.RemoveTeamMemberPayload
import ai.ssot.contextapi.domain.team.dto.TeamPage
import ai.ssot.contextapi.domain.team.dto.TeamView
import ai.ssot.contextapi.domain.team.dto.UpdateTeamInput
import ai.ssot.contextapi.domain.team.dto.UpdateTeamPayload
import ai.ssot.contextapi.domain.team.service.TeamService
import ai.ssot.contextapi.shared.graphql.executeMutation
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsData
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class TeamController(
    private val teamService: TeamService,
) {
    @DgsQuery
    fun teams(
        @InputArgument page: Int,
        @InputArgument size: Int,
    ): TeamPage = teamService.teams(page, size)

    @DgsQuery
    fun team(@InputArgument id: Long): TeamView? = teamService.team(id)

    @DgsMutation
    fun createTeam(@InputArgument input: CreateTeamInput): CreateTeamPayload =
        executeMutation(
            action = { teamService.createTeam(input) },
            onError = { CreateTeamPayload(errors = it) },
        )

    @DgsMutation
    fun updateTeam(@InputArgument input: UpdateTeamInput): UpdateTeamPayload =
        executeMutation(
            action = { teamService.updateTeam(input) },
            onError = { UpdateTeamPayload(errors = it) },
        )

    @DgsMutation
    fun deleteTeam(@InputArgument input: DeleteTeamInput): DeleteTeamPayload =
        executeMutation(
            action = { teamService.deleteTeam(input) },
            onError = { DeleteTeamPayload(errors = it) },
        )

    @DgsMutation
    fun addTeamMember(@InputArgument input: AddTeamMemberInput): AddTeamMemberPayload =
        executeMutation(
            action = { teamService.addTeamMember(input) },
            onError = { AddTeamMemberPayload(errors = it) },
        )

    @DgsMutation
    fun removeTeamMember(@InputArgument input: RemoveTeamMemberInput): RemoveTeamMemberPayload =
        executeMutation(
            action = { teamService.removeTeamMember(input) },
            onError = { RemoveTeamMemberPayload(errors = it) },
        )

    @DgsData(parentType = "Team", field = "members")
    fun members(
        dfe: DgsDataFetchingEnvironment,
        @InputArgument page: Int,
        @InputArgument size: Int,
    ): MemberPage {
        val source = dfe.getSourceOrThrow<TeamView>()
        return teamService.teamMembers(source.id, page, size)
    }
}
