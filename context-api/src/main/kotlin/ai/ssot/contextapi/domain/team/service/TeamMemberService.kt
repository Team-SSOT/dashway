package ai.ssot.contextapi.domain.team.service

import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.domain.member.service.MemberService
import ai.ssot.contextapi.domain.team.dto.TeamDto
import ai.ssot.contextapi.domain.team.dto.TeamMemberDto
import ai.ssot.contextapi.domain.team.entity.TeamMember
import ai.ssot.contextapi.domain.team.entity.TeamMemberId
import ai.ssot.contextapi.domain.team.repository.TeamMemberRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TeamMemberService(
    private val teamService: TeamService,
    private val memberService: MemberService,
    private val teamMemberRepository: TeamMemberRepository
) {

    @Transactional
    fun addMember(teamId: Long, memberId: Long): TeamMemberDto {
        val team = teamService.getById(teamId)
        val member = memberService.getById(memberId)

        return teamMemberRepository.save(
            TeamMember(
                id = TeamMemberId(team.id!!, member.id!!)
            )
        ).let {
            TeamMemberDto(
                team = TeamDto(
                    id = team.id!!,
                    name = team.name,
                    createdDatetime = team.createdDatetime,
                ),
                member = MemberDto(
                    id = member.id!!,
                    name = member.name,
                    email = member.email,
                    isAdmin = member.isAdmin,
                    isEnabled = member.isEnabled,
                    createdDatetime = member.createdDatetime,
                ),
            )
        }
    }
}