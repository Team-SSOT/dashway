package ai.ssot.contextapi.domain.team.controller

import ai.ssot.contextapi.domain.team.service.TeamMemberService
import ai.ssot.contextapi.generated.types.AddTeamMemberInput
import ai.ssot.contextapi.generated.types.TeamMember
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation

@DgsComponent
class TeamMemberController(
    private val teamMemberService: TeamMemberService
) {

    @DgsMutation
    fun addTeamMember(input: AddTeamMemberInput): TeamMember {
        return teamMemberService.addMember(input.teamId, input.memberId).toGraphQL()
    }
}