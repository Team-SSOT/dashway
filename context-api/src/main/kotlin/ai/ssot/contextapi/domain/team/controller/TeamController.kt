package ai.ssot.contextapi.domain.team.controller

import ai.ssot.contextapi.domain.auth.service.withAdmin
import ai.ssot.contextapi.domain.team.dataloader.TeamMemberDataLoader
import ai.ssot.contextapi.domain.team.service.TeamService
import ai.ssot.contextapi.generated.types.*
import ai.ssot.contextapi.shared.page.PageInfo
import com.netflix.graphql.dgs.*
import java.util.concurrent.CompletableFuture

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
    fun team(@InputArgument id: Long): Team? = teamService.getDtoById(id).toGraphQL()

    @DgsMutation
    fun createTeam(@InputArgument input: CreateTeamInput): Team =
        withAdmin {
            teamService.createTeam(input.name).toGraphQL()
        }

    @DgsMutation
    fun updateTeam(@InputArgument input: UpdateTeamInput): Team =
        withAdmin {
            teamService.updateTeam(input.id, input.name).toGraphQL()
        }

    @DgsMutation
    fun deleteTeam(@InputArgument input: DeleteTeamInput): Boolean =
        withAdmin {
            teamService.deleteTeam(input.id)
        }

    @DgsData(parentType = "Team", field = "members")
    fun members(dfe: DgsDataFetchingEnvironment): CompletableFuture<List<Member>> {
        val source = dfe.getSourceOrThrow<Team>()
        return dfe.getDataLoader<Long, List<Member>>(TeamMemberDataLoader::class.java)
            .load(source.id)
    }
}
