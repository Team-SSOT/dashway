package ai.ssot.contextapi.domain.team.service

import ai.ssot.contextapi.domain.auth.service.CurrentViewerService
import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.domain.member.dto.MemberPage
import ai.ssot.contextapi.domain.member.exception.MemberNotFoundException
import ai.ssot.contextapi.domain.member.service.MemberLookupService
import ai.ssot.contextapi.domain.team.dto.*
import ai.ssot.contextapi.domain.team.entity.Team
import ai.ssot.contextapi.domain.team.entity.TeamMember
import ai.ssot.contextapi.domain.team.entity.TeamMemberId
import ai.ssot.contextapi.domain.team.exception.MembershipAlreadyExistsException
import ai.ssot.contextapi.domain.team.exception.MembershipNotFoundException
import ai.ssot.contextapi.domain.team.exception.TeamNotEmptyException
import ai.ssot.contextapi.domain.team.exception.TeamNotFoundException
import ai.ssot.contextapi.domain.team.repository.TeamMemberRepository
import ai.ssot.contextapi.domain.team.repository.TeamRepository
import ai.ssot.contextapi.shared.page.PageInfo
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
        val teamPage = teamRepository.findAll(PageSupport.pageRequest(page, size))
        return TeamPage(
            items = teamPage.content.map { team ->
                TeamDto(
                    id = checkNotNull(team.id),
                    name = team.name,
                    createdDatetime = team.createdDatetime,
                )
            },
            pageInfo = PageInfo(
                page = teamPage.number,
                size = teamPage.size,
                totalElements = teamPage.totalElements.toInt(),
                totalPages = teamPage.totalPages,
            ),
        )
    }

    @Transactional(readOnly = true)
    fun team(id: Long): TeamDto? {
        currentViewerService.requireAdmin()
        val team = teamRepository.findById(id).orElse(null) ?: return null
        return TeamDto(
            id = checkNotNull(team.id),
            name = team.name,
            createdDatetime = team.createdDatetime,
        )
    }

    @Transactional(readOnly = true)
    fun teamMembers(teamId: Long, page: Int, size: Int): MemberPage {
        currentViewerService.requireAdmin()
        val memberPage = teamMemberRepository.findMemberSummariesByTeamId(
            teamId,
            PageSupport.pageRequest(page, size, Sort.unsorted()),
        )
        return MemberPage(
            items = memberPage.content.map { member ->
                MemberDto(
                    id = member.id,
                    name = member.name,
                    email = member.email,
                    admin = member.admin,
                    enabled = member.enabled,
                    createdDatetime = member.createdDatetime,
                )
            },
            pageInfo = PageInfo(
                page = memberPage.number,
                size = memberPage.size,
                totalElements = memberPage.totalElements.toInt(),
                totalPages = memberPage.totalPages,
            ),
        )
    }

    @Transactional
    fun createTeam(input: CreateTeamInput): TeamDto {
        currentViewerService.requireAdmin()
        val name = input.name.trim()
        requireNonBlankText("name", name)

        val savedTeam = teamRepository.save(Team(name = name))
        return TeamDto(
            id = checkNotNull(savedTeam.id),
            name = savedTeam.name,
            createdDatetime = savedTeam.createdDatetime,
        )
    }

    @Transactional
    fun updateTeam(input: UpdateTeamInput): TeamDto {
        currentViewerService.requireAdmin()
        val teamId = input.id
        val team = teamRepository.findById(teamId).orElseThrow { TeamNotFoundException(teamId) }
        val name = input.name.trim()
        requireNonBlankText("name", name)

        team.name = name
        val savedTeam = teamRepository.save(team)
        return TeamDto(
            id = checkNotNull(savedTeam.id),
            name = savedTeam.name,
            createdDatetime = savedTeam.createdDatetime,
        )
    }

    @Transactional
    fun deleteTeam(input: DeleteTeamInput): Boolean {
        currentViewerService.requireAdmin()
        val teamId = input.id
        if (!teamRepository.existsById(teamId)) {
            throw TeamNotFoundException(teamId)
        }
        if (teamMemberRepository.existsByIdTeamId(teamId)) {
            throw TeamNotEmptyException(teamId)
        }

        teamRepository.deleteById(teamId)
        return true
    }

    @Transactional
    fun addTeamMember(input: AddTeamMemberInput): TeamMembershipDto {
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
        return TeamMembershipDto(
            team = TeamDto(
                id = checkNotNull(team.id),
                name = team.name,
                createdDatetime = team.createdDatetime,
            ),
            member = MemberDto(
                id = member.id,
                name = member.name,
                email = member.email,
                admin = member.admin,
                enabled = member.enabled,
                createdDatetime = member.createdDatetime,
            ),
        )
    }

    @Transactional
    fun removeTeamMember(input: RemoveTeamMemberInput): TeamMembershipDto {
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
        return TeamMembershipDto(
            team = TeamDto(
                id = checkNotNull(team.id),
                name = team.name,
                createdDatetime = team.createdDatetime,
            ),
            member = MemberDto(
                id = member.id,
                name = member.name,
                email = member.email,
                admin = member.admin,
                enabled = member.enabled,
                createdDatetime = member.createdDatetime,
            ),
        )
    }
}
