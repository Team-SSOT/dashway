package ai.ssot.contextapi.domain.team.controller

import ai.ssot.contextapi.domain.auth.service.withAdmin
import ai.ssot.contextapi.domain.team.service.TeamMemberService
import ai.ssot.contextapi.generated.types.AddTeamMemberInput
import ai.ssot.contextapi.generated.types.RemoveTeamMemberInput
import ai.ssot.contextapi.generated.types.TeamMember
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class TeamMemberController(
    private val teamMemberService: TeamMemberService
) {

    @DgsMutation
    fun addTeamMember(@InputArgument input: AddTeamMemberInput): TeamMember {
        return withAdmin {
            teamMemberService.addMember(input.teamId, input.memberId).toGraphQL()
        }
    }

    @DgsMutation
    fun removeTeamMember(@InputArgument input: RemoveTeamMemberInput): TeamMember {
        return withAdmin {
            teamMemberService.removeMember(input.teamId, input.memberId).toGraphQL()
        }
    }
}
