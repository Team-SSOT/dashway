package ai.ssot.issuetracker.domain.project.dto

import ai.ssot.issuetracker.domain.project.entity.ProjectRole
import ai.ssot.issuetracker.generated.types.ArchiveProjectInput
import ai.ssot.issuetracker.generated.types.CreateProjectInput
import ai.ssot.issuetracker.generated.types.ProjectMemberInput
import ai.ssot.issuetracker.generated.types.ProjectsInput
import ai.ssot.issuetracker.generated.types.UpdateProjectInput
import ai.ssot.issuetracker.generated.types.PageInfo as GraphQlPageInfo
import ai.ssot.issuetracker.generated.types.Project as GraphQlProject
import ai.ssot.issuetracker.generated.types.ProjectMember as GraphQlProjectMember
import ai.ssot.issuetracker.generated.types.ProjectPage as GraphQlProjectPage
import ai.ssot.issuetracker.generated.types.ProjectRole as GraphQlProjectRole

fun CreateProjectInput.toDto(): CreateProjectDto =
    CreateProjectDto(
        key = key,
        name = name,
        description = description,
    )

fun UpdateProjectInput.toDto(): UpdateProjectDto =
    UpdateProjectDto(
        projectId = projectId,
        name = name,
        description = description,
    )

fun ArchiveProjectInput.toDto(): ArchiveProjectDto =
    ArchiveProjectDto(projectId = projectId)

fun ProjectMemberInput.toDto(): ProjectMemberCommandDto =
    ProjectMemberCommandDto(
        projectId = projectId,
        memberId = memberId,
        role = role?.let { ProjectRole.valueOf(it.name) } ?: ProjectRole.MEMBER,
    )

fun ProjectsInput.toDto(): ProjectSearchDto =
    ProjectSearchDto(
        page = page,
        size = size,
    )

fun ProjectSearchResult.toGraphQL(): GraphQlProjectPage =
    GraphQlProjectPage(
        projects.map { it.toGraphQL() },
        GraphQlPageInfo(page, size, Math.toIntExact(totalElements), totalPages),
    )

fun ProjectDto.toGraphQL(): GraphQlProject =
    GraphQlProject(
        id,
        key,
        name,
        description,
        Math.toIntExact(memberCount),
        createdDatetime,
        updatedDatetime,
    )

fun ProjectMemberDto.toGraphQL(): GraphQlProjectMember =
    GraphQlProjectMember(
        projectId,
        memberId,
        GraphQlProjectRole.valueOf(role.name),
        joinedDatetime,
    )
