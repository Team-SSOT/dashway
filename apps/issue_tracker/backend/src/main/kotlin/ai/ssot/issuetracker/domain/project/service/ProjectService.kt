package ai.ssot.issuetracker.domain.project.service

import ai.ssot.issuetracker.domain.issue.repository.IssueRepository
import ai.ssot.issuetracker.domain.project.dto.ArchiveProjectDto
import ai.ssot.issuetracker.domain.project.dto.CreateProjectDto
import ai.ssot.issuetracker.domain.project.dto.ProjectDto
import ai.ssot.issuetracker.domain.project.dto.ProjectSearchDto
import ai.ssot.issuetracker.domain.project.dto.ProjectSearchResult
import ai.ssot.issuetracker.domain.project.dto.UpdateProjectDto
import ai.ssot.issuetracker.domain.project.dto.toDto
import ai.ssot.issuetracker.domain.project.entity.Project
import ai.ssot.issuetracker.domain.project.entity.ProjectMember
import ai.ssot.issuetracker.domain.project.entity.ProjectMemberId
import ai.ssot.issuetracker.domain.project.entity.ProjectRole
import ai.ssot.issuetracker.domain.project.exception.InvalidProjectRequestException
import ai.ssot.issuetracker.domain.project.repository.ProjectMemberRepository
import ai.ssot.issuetracker.domain.project.repository.ProjectRepository
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

@Service
class ProjectService(
    private val projectRepository: ProjectRepository,
    private val projectMemberRepository: ProjectMemberRepository,
    private val projectMemberService: ProjectMemberService,
    private val issueRepository: IssueRepository,
) {
    @Transactional
    fun createProject(memberId: Long, dto: CreateProjectDto): ProjectDto {
        val key = normalizeProjectKey(dto.key)
        val name = normalizeRequiredText(dto.name, "Project name")
        val now = OffsetDateTime.now()

        if (projectRepository.existsByKey(key)) {
            throw InvalidProjectRequestException("Project key already exists.")
        }

        val project = try {
            projectRepository.saveAndFlush(
                Project(
                    key = key,
                    name = name,
                    description = dto.description?.trim()?.takeIf { it.isNotEmpty() },
                    createdDatetime = now,
                    updatedDatetime = now,
                ),
            )
        } catch (exception: DataIntegrityViolationException) {
            throw InvalidProjectRequestException("Project key already exists.")
        }

        projectMemberRepository.saveAndFlush(
            ProjectMember(
                id = ProjectMemberId(
                    projectId = requireNotNull(project.id),
                    memberId = memberId,
                ),
                role = ProjectRole.OWNER,
                joinedDatetime = now,
            ),
        )

        return project.toDto(memberCount = 1)
    }

    @Transactional(readOnly = true)
    fun getProjects(memberId: Long, dto: ProjectSearchDto): ProjectSearchResult {
        val pageable = PageRequest.of(validatePage(dto.page), validateSize(dto.size))
        val projects = projectRepository.findJoinedProjects(memberId, pageable)
        val memberCounts = projectMemberService.getMemberCounts(projects.content.mapNotNull { it.id })

        return ProjectSearchResult(
            projects = projects.content.map { project ->
                project.toDto(memberCounts[requireNotNull(project.id)] ?: 0)
            },
            page = dto.page,
            size = pageable.pageSize,
            totalElements = projects.totalElements,
            totalPages = projects.totalPages,
        )
    }

    @Transactional(readOnly = true)
    fun getProject(memberId: Long, projectId: Long): ProjectDto? {
        val project = projectRepository.findByIdAndIsEnabledTrueAndIsDeletedFalse(projectId) ?: return null
        projectMemberService.validateProjectMember(projectId, memberId)
        val memberCount = projectMemberService.getMemberCounts(listOf(projectId))[projectId] ?: 0
        return project.toDto(memberCount)
    }

    @Transactional
    fun updateProject(memberId: Long, dto: UpdateProjectDto): ProjectDto {
        val project = projectMemberService.validateProjectOwner(dto.projectId, memberId)
        dto.name?.let { project.name = normalizeRequiredText(it, "Project name") }
        dto.description?.let { project.description = it.trim().takeIf { description -> description.isNotEmpty() } }
        project.updatedDatetime = OffsetDateTime.now()
        return project.toDto(
            memberCount = projectMemberService.getMemberCounts(listOf(dto.projectId))[dto.projectId] ?: 0,
        )
    }

    @Transactional
    fun archiveProject(memberId: Long, dto: ArchiveProjectDto): Boolean {
        val project = projectMemberService.validateProjectOwner(dto.projectId, memberId)
        if (issueRepository.existsByProjectIdAndIsEnabledTrueAndIsDeletedFalse(dto.projectId)) {
            throw InvalidProjectRequestException("Archive active issues before archiving the project.")
        }

        val now = OffsetDateTime.now()
        project.isEnabled = false
        project.isDeleted = true
        project.updatedDatetime = now
        project.deletedDatetime = now
        return true
    }

    private fun normalizeProjectKey(rawKey: String): String {
        val key = rawKey.trim()
        if (key.isEmpty()) {
            throw InvalidProjectRequestException("Project key is required.")
        }
        if (key.length > 32) {
            throw InvalidProjectRequestException("Project key must be 32 characters or fewer.")
        }
        return key
    }

    private fun normalizeRequiredText(rawValue: String, fieldName: String): String {
        val value = rawValue.trim()
        if (value.isEmpty()) {
            throw InvalidProjectRequestException("$fieldName is required.")
        }
        return value
    }

    private fun validatePage(page: Int): Int {
        if (page < 0) {
            throw InvalidProjectRequestException("page must be zero or greater.")
        }
        return page
    }

    private fun validateSize(size: Int): Int {
        if (size !in 1..MAX_PROJECT_SEARCH_SIZE) {
            throw InvalidProjectRequestException("size must be between 1 and $MAX_PROJECT_SEARCH_SIZE.")
        }
        return size
    }
}

private const val MAX_PROJECT_SEARCH_SIZE = 100
