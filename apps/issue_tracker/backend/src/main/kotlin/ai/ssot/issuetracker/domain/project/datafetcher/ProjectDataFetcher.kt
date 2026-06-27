package ai.ssot.issuetracker.domain.project.datafetcher

import ai.ssot.issuetracker.config.auth.withMemberId
import ai.ssot.issuetracker.domain.project.dto.toDto
import ai.ssot.issuetracker.domain.project.dto.toGraphQL
import ai.ssot.issuetracker.domain.project.service.ProjectMemberService
import ai.ssot.issuetracker.domain.project.service.ProjectService
import ai.ssot.issuetracker.generated.types.ArchiveProjectInput
import ai.ssot.issuetracker.generated.types.CreateProjectInput
import ai.ssot.issuetracker.generated.types.Project
import ai.ssot.issuetracker.generated.types.ProjectMember
import ai.ssot.issuetracker.generated.types.ProjectMemberInput
import ai.ssot.issuetracker.generated.types.ProjectPage
import ai.ssot.issuetracker.generated.types.ProjectsInput
import ai.ssot.issuetracker.generated.types.UpdateProjectInput
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class ProjectDataFetcher(
    private val projectService: ProjectService,
    private val projectMemberService: ProjectMemberService,
) {
    @DgsQuery
    fun projects(
        @InputArgument input: ProjectsInput,
    ): ProjectPage =
        withMemberId { memberId ->
            projectService.getProjects(memberId, input.toDto()).toGraphQL()
        }

    @DgsQuery
    fun project(
        @InputArgument id: Long,
    ): Project? =
        withMemberId { memberId ->
            projectService.getProject(memberId, id)?.toGraphQL()
        }

    @DgsMutation
    fun createProject(
        @InputArgument input: CreateProjectInput,
    ): Project =
        withMemberId { memberId ->
            projectService.createProject(memberId, input.toDto()).toGraphQL()
        }

    @DgsMutation
    fun updateProject(
        @InputArgument input: UpdateProjectInput,
    ): Project =
        withMemberId { memberId ->
            projectService.updateProject(memberId, input.toDto()).toGraphQL()
        }

    @DgsMutation
    fun archiveProject(
        @InputArgument input: ArchiveProjectInput,
    ): Boolean =
        withMemberId { memberId ->
            projectService.archiveProject(memberId, input.toDto())
        }

    @DgsMutation
    fun addProjectMember(
        @InputArgument input: ProjectMemberInput,
    ): ProjectMember =
        withMemberId { memberId ->
            projectMemberService.addProjectMember(memberId, input.toDto()).toGraphQL()
        }

    @DgsMutation
    fun removeProjectMember(
        @InputArgument input: ProjectMemberInput,
    ): Boolean =
        withMemberId { memberId ->
            projectMemberService.removeProjectMember(memberId, input.toDto())
        }
}
