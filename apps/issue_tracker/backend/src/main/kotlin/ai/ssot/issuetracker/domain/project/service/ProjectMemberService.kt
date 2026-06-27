package ai.ssot.issuetracker.domain.project.service

import ai.ssot.issuetracker.domain.project.dto.ProjectMemberCommandDto
import ai.ssot.issuetracker.domain.project.dto.ProjectMemberDto
import ai.ssot.issuetracker.domain.project.dto.toDto
import ai.ssot.issuetracker.domain.project.entity.Project
import ai.ssot.issuetracker.domain.project.entity.ProjectMember
import ai.ssot.issuetracker.domain.project.entity.ProjectMemberId
import ai.ssot.issuetracker.domain.project.entity.ProjectRole
import ai.ssot.issuetracker.domain.project.exception.InvalidProjectRequestException
import ai.ssot.issuetracker.domain.project.repository.ProjectMemberRepository
import ai.ssot.issuetracker.domain.project.repository.ProjectRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

@Service
class ProjectMemberService(
    private val projectRepository: ProjectRepository,
    private val projectMemberRepository: ProjectMemberRepository,
) {
    @Transactional
    fun addProjectMember(actorMemberId: Long, dto: ProjectMemberCommandDto): ProjectMemberDto {
        validateProjectOwner(dto.projectId, actorMemberId)

        val member = projectMemberRepository.findByIdProjectIdAndIdMemberId(dto.projectId, dto.memberId)
            ?.also { it.role = dto.role }
            ?: ProjectMember(
                id = ProjectMemberId(projectId = dto.projectId, memberId = dto.memberId),
                role = dto.role,
                joinedDatetime = OffsetDateTime.now(),
            )

        return projectMemberRepository.saveAndFlush(member).toDto()
    }

    @Transactional
    fun removeProjectMember(actorMemberId: Long, dto: ProjectMemberCommandDto): Boolean {
        validateProjectOwner(dto.projectId, actorMemberId)
        val member = projectMemberRepository.findByIdProjectIdAndIdMemberId(dto.projectId, dto.memberId)
            ?: throw InvalidProjectRequestException("Project member not found.")

        if (
            member.role == ProjectRole.OWNER &&
            projectMemberRepository.countByIdProjectIdAndRole(dto.projectId, ProjectRole.OWNER) <= 1
        ) {
            throw InvalidProjectRequestException("Project must have at least one owner.")
        }

        projectMemberRepository.deleteByIdProjectIdAndIdMemberId(dto.projectId, dto.memberId)
        return true
    }

    @Transactional(readOnly = true)
    fun validateActiveProject(projectId: Long): Project =
        projectRepository.findByIdAndIsEnabledTrueAndIsDeletedFalse(projectId)
            ?: throw InvalidProjectRequestException("Project not found.")

    @Transactional(readOnly = true)
    fun validateProjectMember(projectId: Long, memberId: Long): Project {
        val project = validateActiveProject(projectId)
        if (!projectMemberRepository.existsByIdProjectIdAndIdMemberId(projectId, memberId)) {
            throw InvalidProjectRequestException("Project member is required.")
        }
        return project
    }

    @Transactional(readOnly = true)
    fun validateProjectOwner(projectId: Long, memberId: Long): Project {
        val project = validateProjectMember(projectId, memberId)
        val member = projectMemberRepository.findByIdProjectIdAndIdMemberId(projectId, memberId)
            ?: throw InvalidProjectRequestException("Project member is required.")
        if (member.role != ProjectRole.OWNER) {
            throw InvalidProjectRequestException("Project owner is required.")
        }
        return project
    }

    @Transactional(readOnly = true)
    fun validateProjectMembers(projectId: Long, memberIds: Collection<Long>) {
        val distinctMemberIds = memberIds.distinct()
        if (distinctMemberIds.size != memberIds.size) {
            throw InvalidProjectRequestException("memberIds must not contain duplicates.")
        }
        if (distinctMemberIds.isEmpty()) {
            return
        }

        val foundMemberIds = projectMemberRepository
            .findAllByIdProjectIdAndIdMemberIdIn(projectId, distinctMemberIds)
            .map { it.id.memberId }
            .toSet()
        val missingMemberIds = distinctMemberIds.filterNot(foundMemberIds::contains)
        if (missingMemberIds.isNotEmpty()) {
            throw InvalidProjectRequestException("Project members not found: ${missingMemberIds.joinToString(", ")}.")
        }
    }

    @Transactional(readOnly = true)
    fun getMemberCounts(projectIds: Collection<Long>): Map<Long, Long> =
        projectMemberRepository.countMembersByProjectIds(projectIds)
}
