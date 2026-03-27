package ai.ssot.contextapi.domain.team.controller

import ai.ssot.contextapi.domain.team.service.TeamService
import ai.ssot.contextapi.generated.types.*
import ai.ssot.contextapi.shared.page.PageInfo
import com.netflix.graphql.dgs.*

@DgsComponent
class TeamController(
    private val teamService: TeamService,
) {
    @DgsQuery
    fun teams(
        @InputArgument page: Int,
        @InputArgument size: Int,
    ): TeamPage {
        return teamService.getAll(page, size).let { (contents, pageInfo) ->
            TeamPage(
                contents.map { it.toGraphQL() },
                PageInfo(
                    page = pageInfo.page,
                    size = pageInfo.size,
                    totalElements = pageInfo.totalElements,
                    totalPages = pageInfo.totalPages,
                ),
            )
        }
    }

    @DgsQuery
    fun team(@InputArgument id: Long): Team? = teamService.getDtoById(id)?.toGraphQL()

    @DgsMutation
    fun createTeam(@InputArgument input: CreateTeamInput): Team =
        teamService.createTeam(input.name).toGraphQL()

    @DgsMutation
    fun updateTeam(@InputArgument input: UpdateTeamInput): Team =
        teamService.updateTeam(input.id, input.name).toGraphQL()

    @DgsMutation
    fun deleteTeam(@InputArgument input: DeleteTeamInput): Boolean = teamService.deleteTeam(input.id)

    @DgsData(parentType = "Team", field = "members")
    fun members(dfe: DgsDataFetchingEnvironment): List<Member> {
        val source = dfe.getSourceOrThrow<Team>()
        return teamService.getMembersByTeamId(source.id).map { it.toGraphQL() }
    }
}
