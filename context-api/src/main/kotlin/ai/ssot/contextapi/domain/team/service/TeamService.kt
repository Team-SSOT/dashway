package ai.ssot.contextapi.domain.team.service

import ai.ssot.contextapi.domain.auth.service.CurrentViewerService
import ai.ssot.contextapi.domain.member.exception.MemberNotFoundException
import ai.ssot.contextapi.domain.member.service.MemberLookupService
import ai.ssot.contextapi.domain.team.dto.AddTeamMemberInput
import ai.ssot.contextapi.domain.team.dto.AddTeamMemberPayload
import ai.ssot.contextapi.domain.team.dto.CreateTeamInput
import ai.ssot.contextapi.domain.team.dto.CreateTeamPayload
import ai.ssot.contextapi.domain.team.dto.DeleteTeamInput
import ai.ssot.contextapi.domain.team.dto.DeleteTeamPayload
import ai.ssot.contextapi.domain.team.dto.MemberPage
import ai.ssot.contextapi.domain.team.dto.RemoveTeamMemberInput
import ai.ssot.contextapi.domain.team.dto.RemoveTeamMemberPayload
import ai.ssot.contextapi.domain.team.dto.TeamMemberView
import ai.ssot.contextapi.domain.team.dto.TeamPage
import ai.ssot.contextapi.domain.team.dto.TeamView
import ai.ssot.contextapi.domain.team.dto.UpdateTeamInput
import ai.ssot.contextapi.domain.team.dto.UpdateTeamPayload
import ai.ssot.contextapi.domain.team.entity.Team
import ai.ssot.contextapi.domain.team.entity.TeamMember
import ai.ssot.contextapi.domain.team.entity.TeamMemberId
import ai.ssot.contextapi.domain.team.exception.MembershipAlreadyExistsException
import ai.ssot.contextapi.domain.team.exception.MembershipNotFoundException
import ai.ssot.contextapi.domain.team.exception.TeamNotEmptyException
import ai.ssot.contextapi.domain.team.exception.TeamNotFoundException
import ai.ssot.contextapi.domain.team.repository.TeamMemberRepository
import ai.ssot.contextapi.domain.team.repository.TeamRepository
import ai.ssot.contextapi.shared.page.PageSupport
import ai.ssot.contextapi.shared.validation.requireNonBlankText
import org.springframework.data.domain.Sort
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TeamService(
    private val currentViewerService: CurrentViewerService,
    private val memberLookupService: MemberLookupService,
    private val teamMemberRepository: TeamMemberRepository,
    private val teamRepository: TeamRepository,
) {
    @Transactional(readOnly = true)
    fun teams(page: Int, size: Int): TeamPage {
        currentViewerService.requireAdmin()
        return teamRepository.findAll(PageSupport.pageRequest(page, size)).toTeamPage()
    }

    @Transactional(readOnly = true)
    fun team(id: Long): TeamView? {
        currentViewerService.requireAdmin()
        return teamRepository.findById(id).orElse(null)?.toView()
    }

    @Transactional(readOnly = true)
    fun teamMembers(teamId: Long, page: Int, size: Int): MemberPage {
        currentViewerService.requireAdmin()
        return teamMemberRepository.findMemberSummariesByTeamId(
            teamId,
            PageSupport.pageRequest(page, size, Sort.unsorted()),
        ).toMemberPage()
    }

    @Transactional
    fun createTeam(input: CreateTeamInput): CreateTeamPayload {
        currentViewerService.requireAdmin()
        val name = input.name.trim()
        requireNonBlankText("name", name)

        val savedTeam = teamRepository.save(Team(name = name))
        return CreateTeamPayload(team = savedTeam.toView())
    }

    @Transactional
    fun updateTeam(input: UpdateTeamInput): UpdateTeamPayload {
        currentViewerService.requireAdmin()
        val teamId = input.id
        val team = teamRepository.findById(teamId).orElseThrow { TeamNotFoundException(teamId) }
        val name = input.name.trim()
        requireNonBlankText("name", name)

        team.name = name
        return UpdateTeamPayload(team = teamRepository.save(team).toView())
    }

    @Transactional
    fun deleteTeam(input: DeleteTeamInput): DeleteTeamPayload {
        currentViewerService.requireAdmin()
        val teamId = input.id
        if (!teamRepository.existsById(teamId)) {
            throw TeamNotFoundException(teamId)
        }
        if (teamMemberRepository.existsByIdTeamId(teamId)) {
            throw TeamNotEmptyException(teamId)
        }

        teamRepository.deleteById(teamId)
        return DeleteTeamPayload(deleted = true)
    }

    @Transactional
    fun addTeamMember(input: AddTeamMemberInput): AddTeamMemberPayload {
        currentViewerService.requireAdmin()
        val teamId = input.teamId
        val memberId = input.memberId

        val team = teamRepository.findById(teamId).orElseThrow { TeamNotFoundException(teamId) }
        val member = memberLookupService.findMember(memberId)
            ?: throw MemberNotFoundException(memberId)

        if (teamMemberRepository.existsByIdTeamIdAndIdMemberId(teamId, memberId)) {
            throw MembershipAlreadyExistsException(teamId, memberId)
        }

        teamMemberRepository.save(TeamMember(id = TeamMemberId(teamId = teamId, memberId = memberId)))
        return AddTeamMemberPayload(team = team.toView(), member = member.toTeamMemberView())
    }

    @Transactional
    fun removeTeamMember(input: RemoveTeamMemberInput): RemoveTeamMemberPayload {
        currentViewerService.requireAdmin()
        val teamId = input.teamId
        val memberId = input.memberId

        val team = teamRepository.findById(teamId).orElseThrow { TeamNotFoundException(teamId) }
        val member = memberLookupService.findMember(memberId)
            ?: throw MemberNotFoundException(memberId)
        val membershipId = TeamMemberId(teamId = teamId, memberId = memberId)

        if (!teamMemberRepository.existsById(membershipId)) {
            throw MembershipNotFoundException(teamId, memberId)
        }

        teamMemberRepository.deleteById(membershipId)
        return RemoveTeamMemberPayload(team = team.toView(), member = member.toTeamMemberView())
    }
}
