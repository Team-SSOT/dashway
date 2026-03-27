package ai.ssot.contextapi.domain.team.dto

import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.generated.types.Team
import ai.ssot.contextapi.generated.types.TeamMember
import java.time.LocalDateTime

data class TeamDto(
    val id: Long,
    val name: String,
    val createdDatetime: LocalDateTime,
) {
    fun toGraphQL(): Team {
        return Team.newBuilder()
            .id(id)
            .name(name)
            .createdDatetime(createdDatetime)
            .build()
    }
}

data class TeamMemberDto(
    val team: TeamDto,
    val member: MemberDto,
) {
    fun toGraphQL(): TeamMember {
        return TeamMember.newBuilder()
            .team(team.toGraphQL())
            .member(member.toGraphQL())
            .build()
    }
}
