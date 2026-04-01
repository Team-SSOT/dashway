package ai.ssot.contextapi.domain.team.service

import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.service.MemberService
import ai.ssot.contextapi.domain.team.dto.TeamMemberDto
import ai.ssot.contextapi.domain.team.entity.TeamMember
import ai.ssot.contextapi.domain.team.entity.TeamMemberId
import ai.ssot.contextapi.domain.team.exception.MembershipAlreadyExistsException
import ai.ssot.contextapi.domain.team.exception.TeamMemberNotFoundException
import ai.ssot.contextapi.domain.team.repository.TeamMemberRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TeamMemberService(
    private val teamService: TeamService,
    private val memberService: MemberService,
    private val teamMemberRepository: TeamMemberRepository
) {
    @Transactional(readOnly = true)
    fun getTeamIdToMembers(teamIds: List<Long>): Map<Long, List<Member>> {
        if (teamIds.isEmpty()) {
            return emptyMap()
        }
        return teamMemberRepository.getTeamIdToMembers(teamIds)
    }

    @Transactional
    fun addMember(teamId: Long, memberId: Long): TeamMemberDto {
        if (teamMemberRepository.existsByIdTeamIdAndIdMemberId(teamId, memberId)) {
            throw MembershipAlreadyExistsException(teamId, memberId)
        }

        val team = teamService.getById(teamId)
        val member = memberService.getDtoById(memberId)

        return teamMemberRepository.save(
            TeamMember(
                id = TeamMemberId(team.id!!, member.id!!)
            )
        ).let {
            TeamMemberDto(
                team = teamService.getDtoById(checkNotNull(team.id)),
                member = member,
            )
        }
    }

    @Transactional
    fun removeMember(teamId: Long, memberId: Long): TeamMemberDto {
        if (!teamMemberRepository.existsByIdTeamIdAndIdMemberId(teamId, memberId)) {
            throw TeamMemberNotFoundException(teamId, memberId)
        }

        val team = teamService.getDtoById(teamId)
        val member = memberService.getDtoById(memberId)
        teamMemberRepository.deleteById(TeamMemberId(teamId, memberId))

        return TeamMemberDto(
            team = team,
            member = member,
        )
    }
}
