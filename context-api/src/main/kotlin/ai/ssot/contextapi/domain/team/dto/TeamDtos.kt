package ai.ssot.contextapi.domain.team.dto

import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.shared.page.PageInfo
import java.time.LocalDateTime

data class CreateTeamInput(
    val name: String,
)

data class UpdateTeamInput(
    val id: Long,
    val name: String,
)

data class DeleteTeamInput(
    val id: Long,
)

data class AddTeamMemberInput(
    val teamId: Long,
    val memberId: Long,
)

data class RemoveTeamMemberInput(
    val teamId: Long,
    val memberId: Long,
)

data class TeamDto(
    val id: Long,
    val name: String,
    val createdDatetime: LocalDateTime,
)

data class TeamMembershipDto(
    val team: TeamDto,
    val member: MemberDto,
)

data class TeamPage(
    val teams: List<TeamDto>,
    val pageInfo: PageInfo,
)
