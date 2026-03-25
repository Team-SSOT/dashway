package ai.ssot.contextapi.domain.team.controller

import ai.ssot.contextapi.domain.member.dto.MemberPage
import ai.ssot.contextapi.domain.team.dto.*
import ai.ssot.contextapi.domain.team.service.TeamService
import com.netflix.graphql.dgs.*

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
    fun team(@InputArgument id: Long): TeamDto? = teamService.team(id)

    @DgsMutation
    fun createTeam(@InputArgument input: CreateTeamInput): TeamDto = teamService.createTeam(input)

    @DgsMutation
    fun updateTeam(@InputArgument input: UpdateTeamInput): TeamDto = teamService.updateTeam(input)

    @DgsMutation
    fun deleteTeam(@InputArgument input: DeleteTeamInput): Boolean = teamService.deleteTeam(input)

    @DgsMutation
    fun addTeamMember(@InputArgument input: AddTeamMemberInput): TeamMembershipDto = teamService.addTeamMember(input)

    @DgsMutation
    fun removeTeamMember(@InputArgument input: RemoveTeamMemberInput): TeamMembershipDto = teamService.removeTeamMember(input)

    @DgsData(parentType = "Team", field = "members")
    fun members(
        dfe: DgsDataFetchingEnvironment,
        @InputArgument page: Int,
        @InputArgument size: Int,
    ): MemberPage {
        val source = dfe.getSourceOrThrow<TeamDto>()
        return teamService.teamMembers(source.id, page, size)
    }
}
