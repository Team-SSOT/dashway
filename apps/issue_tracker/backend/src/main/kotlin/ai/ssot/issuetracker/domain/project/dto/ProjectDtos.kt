package ai.ssot.issuetracker.domain.project.dto

import ai.ssot.issuetracker.domain.project.entity.Project
import ai.ssot.issuetracker.domain.project.entity.ProjectMember
import ai.ssot.issuetracker.domain.project.entity.ProjectRole
import java.time.OffsetDateTime

data class CreateProjectDto(
    val key: String,
    val name: String,
    val description: String?,
)

data class UpdateProjectDto(
    val projectId: Long,
    val name: String?,
    val description: String?,
)

data class ArchiveProjectDto(
    val projectId: Long,
)

data class ProjectMemberCommandDto(
    val projectId: Long,
    val memberId: Long,
    val role: ProjectRole,
)

data class ProjectSearchDto(
    val page: Int,
    val size: Int,
)

data class ProjectSearchResult(
    val projects: List<ProjectDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)

data class ProjectDto(
    val id: Long,
    val key: String,
    val name: String,
    val description: String?,
    val memberCount: Long,
    val createdDatetime: OffsetDateTime,
    val updatedDatetime: OffsetDateTime,
)

data class ProjectMemberDto(
    val projectId: Long,
    val memberId: Long,
    val role: ProjectRole,
    val joinedDatetime: OffsetDateTime,
)

fun Project.toDto(memberCount: Long = 0): ProjectDto =
    ProjectDto(
        id = requireNotNull(id),
        key = key,
        name = name,
        description = description,
        memberCount = memberCount,
        createdDatetime = createdDatetime,
        updatedDatetime = updatedDatetime,
    )

fun ProjectMember.toDto(): ProjectMemberDto =
    ProjectMemberDto(
        projectId = id.projectId,
        memberId = id.memberId,
        role = role,
        joinedDatetime = joinedDatetime,
    )
