package ai.ssot.contextapi.domain.team.service

import ai.ssot.contextapi.domain.team.dto.TeamDto
import ai.ssot.contextapi.domain.team.dto.TeamSearchResult
import ai.ssot.contextapi.domain.team.entity.Team
import ai.ssot.contextapi.domain.team.exception.TeamNotEmptyException
import ai.ssot.contextapi.domain.team.exception.TeamNotFoundException
import ai.ssot.contextapi.domain.team.repository.TeamMemberRepository
import ai.ssot.contextapi.domain.team.repository.TeamRepository
import ai.ssot.contextapi.shared.page.PageResult
import ai.ssot.contextapi.shared.page.PageSupport
import ai.ssot.contextapi.shared.validation.requireNonBlankText
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class TeamService(
    private val teamMemberRepository: TeamMemberRepository,
    private val teamRepository: TeamRepository,
) {
    @Transactional(readOnly = true)
    fun getAll(page: Int, size: Int): PageResult<TeamDto> {
        val teamPage = teamRepository.findAll(PageSupport.pageRequest(page, size))
            .map { team ->
                TeamDto(
                    id = checkNotNull(team.id),
                    name = team.name,
                    createdDatetime = team.createdDatetime,
                )
            }

        return PageResult(teamPage)
    }

    @Transactional(readOnly = true)
    fun getDtoById(id: Long): TeamDto {
        return getById(id).let {
                TeamDto(
                    id = it.id!!,
                    name = it.name,
                    createdDatetime = it.createdDatetime,
                )
            }
    }

    @Transactional(readOnly = true)
    fun search(query: String, pageable: Pageable): Page<Team> =
        teamRepository.search(query, pageable)

    @Transactional(readOnly = true)
    fun getTeamIdsByMemberId(memberId: Long): List<Long> =
        teamMemberRepository.findAllByIdMemberId(memberId)
            .map { it.id.teamId }

    @Transactional(readOnly = true)
    fun getById(id: Long): Team {
        return teamRepository.findById(id).orElseThrow { TeamNotFoundException(id) }
    }

    @Transactional
    fun createTeam(name: String): TeamDto {
        val normalizedName = name.trim()
        requireNonBlankText("name", normalizedName)

        val savedTeam = teamRepository.save(Team(name = normalizedName))
        return TeamDto(
            id = checkNotNull(savedTeam.id),
            name = savedTeam.name,
            createdDatetime = savedTeam.createdDatetime,
        )
    }

    @Transactional
    fun updateTeam(id: Long, name: String): TeamDto {
        val team = teamRepository.findById(id).orElseThrow { TeamNotFoundException(id) }
        val normalizedName = name.trim()
        requireNonBlankText("name", normalizedName)

        team.name = normalizedName
        val savedTeam = teamRepository.save(team)
        return TeamDto(
            id = checkNotNull(savedTeam.id),
            name = savedTeam.name,
            createdDatetime = savedTeam.createdDatetime,
        )
    }

    @Transactional
    fun deleteTeam(id: Long): Boolean {
        if (!teamRepository.existsById(id)) {
            throw TeamNotFoundException(id)
        }
        if (teamMemberRepository.existsByIdTeamId(id)) {
            throw TeamNotEmptyException(id)
        }

        teamRepository.deleteById(id)
        return true
    }
}
