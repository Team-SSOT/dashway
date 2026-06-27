package ai.ssot.issuetracker.domain.issue.service

import ai.ssot.issuetracker.domain.issue.dto.ArchiveIssueDto
import ai.ssot.issuetracker.domain.issue.dto.AttachIssueFilesDto
import ai.ssot.issuetracker.domain.issue.dto.CreateIssueDto
import ai.ssot.issuetracker.domain.issue.dto.DetachIssueFileDto
import ai.ssot.issuetracker.domain.issue.dto.IssueDto
import ai.ssot.issuetracker.domain.issue.dto.IssueSearchDto
import ai.ssot.issuetracker.domain.issue.dto.IssueSearchResult
import ai.ssot.issuetracker.domain.issue.dto.UpdateIssueDto
import ai.ssot.issuetracker.domain.issue.dto.toIssueDto
import ai.ssot.issuetracker.domain.issue.entity.Issue
import ai.ssot.issuetracker.domain.issue.entity.IssueAssignee
import ai.ssot.issuetracker.domain.issue.entity.IssueAssigneeId
import ai.ssot.issuetracker.domain.issue.entity.IssuePriority
import ai.ssot.issuetracker.domain.issue.entity.IssueStatus
import ai.ssot.issuetracker.domain.issue.exception.InvalidIssueRequestException
import ai.ssot.issuetracker.domain.issue.repository.IssueAssigneeRepository
import ai.ssot.issuetracker.domain.issue.repository.IssueRepository
import ai.ssot.issuetracker.domain.project.service.ProjectMemberService
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

@Service
class IssueService(
    private val issueRepository: IssueRepository,
    private val issueAssigneeRepository: IssueAssigneeRepository,
    private val issueLabelService: IssueLabelService,
    private val issueFileService: IssueFileService,
    private val projectMemberService: ProjectMemberService,
) {
    @Transactional(readOnly = true)
    fun getIssues(memberId: Long, dto: IssueSearchDto): IssueSearchResult {
        val pageable = PageRequest.of(validatePage(dto.page), validateSize(dto.size))
        val issues = issueRepository.findIssuesForMember(memberId, dto, pageable)
        return IssueSearchResult(
            issues = issues.content.map { it.toIssueDto() },
            page = dto.page,
            size = pageable.pageSize,
            totalElements = issues.totalElements,
            totalPages = issues.totalPages,
        )
    }

    @Transactional(readOnly = true)
    fun getIssue(memberId: Long, issueId: Long): IssueDto? {
        val issue = issueRepository.findIssueForMember(memberId, issueId) ?: return null
        return issue.toIssueDto()
    }

    @Transactional
    fun createIssue(memberId: Long, dto: CreateIssueDto): IssueDto {
        projectMemberService.validateProjectMember(dto.projectId, memberId)
        projectMemberService.validateProjectMembers(dto.projectId, dto.assigneeMemberIds)
        dto.reporterMemberId?.let { projectMemberService.validateProjectMembers(dto.projectId, listOf(it)) }
        issueLabelService.validateLabelIds(dto.projectId, dto.labelIds)

        val now = OffsetDateTime.now()
        val issue = issueRepository.saveAndFlush(
            Issue(
                projectId = dto.projectId,
                title = normalizeTitle(dto.title),
                content = dto.content?.trim()?.takeIf { it.isNotEmpty() },
                status = dto.status ?: IssueStatus.BACKLOG,
                priority = dto.priority ?: IssuePriority.NO_PRIORITY,
                reporterMemberId = dto.reporterMemberId ?: memberId,
                creatorMemberId = memberId,
                dueDatetime = dto.dueDatetime,
                createdDatetime = now,
                updatedDatetime = now,
            ),
        )

        val issueId = requireNotNull(issue.id)
        replaceAssignees(issueId, dto.assigneeMemberIds)
        issueLabelService.replaceIssueLabels(issueId, dto.projectId, dto.labelIds)
        issueFileService.replaceIssueFiles(issueId, dto.fileIds)

        return requireNotNull(getIssue(memberId, issueId))
    }

    @Transactional
    fun updateIssue(memberId: Long, dto: UpdateIssueDto): IssueDto {
        val issue = loadActiveIssue(dto.issueId)
        projectMemberService.validateProjectMember(issue.projectId, memberId)

        dto.title?.let { issue.title = normalizeTitle(it) }
        dto.content?.let { issue.content = it.trim().takeIf { content -> content.isNotEmpty() } }
        dto.status?.let { issue.status = it }
        dto.priority?.let { issue.priority = it }
        dto.reporterMemberId?.let { reporterMemberId ->
            projectMemberService.validateProjectMembers(issue.projectId, listOf(reporterMemberId))
            issue.reporterMemberId = reporterMemberId
        }
        dto.assigneeMemberIds?.let { assigneeMemberIds ->
            projectMemberService.validateProjectMembers(issue.projectId, assigneeMemberIds)
            replaceAssignees(dto.issueId, assigneeMemberIds)
        }
        dto.labelIds?.let { issueLabelService.replaceIssueLabels(dto.issueId, issue.projectId, it) }
        dto.dueDatetime?.let { issue.dueDatetime = it }
        issue.updatedDatetime = OffsetDateTime.now()

        return requireNotNull(getIssue(memberId, dto.issueId))
    }

    @Transactional
    fun archiveIssue(memberId: Long, dto: ArchiveIssueDto): Boolean {
        val issue = loadActiveIssue(dto.issueId)
        projectMemberService.validateProjectMember(issue.projectId, memberId)

        val now = OffsetDateTime.now()
        issue.isEnabled = false
        issue.isDeleted = true
        issue.updatedDatetime = now
        issue.deletedDatetime = now
        return true
    }

    @Transactional
    fun attachIssueFiles(memberId: Long, dto: AttachIssueFilesDto): IssueDto {
        val issue = loadActiveIssue(dto.issueId)
        projectMemberService.validateProjectMember(issue.projectId, memberId)
        issueFileService.addIssueFiles(dto.issueId, dto.fileIds)
        issue.updatedDatetime = OffsetDateTime.now()
        return requireNotNull(getIssue(memberId, dto.issueId))
    }

    @Transactional
    fun detachIssueFile(memberId: Long, dto: DetachIssueFileDto): IssueDto {
        val issue = loadActiveIssue(dto.issueId)
        projectMemberService.validateProjectMember(issue.projectId, memberId)
        issueFileService.removeIssueFile(dto.issueId, dto.fileId)
        issue.updatedDatetime = OffsetDateTime.now()
        return requireNotNull(getIssue(memberId, dto.issueId))
    }

    @Transactional(readOnly = true)
    fun getAssigneeMemberIdsByIssueIds(issueIds: Collection<Long>): Map<Long, List<Long>> {
        if (issueIds.isEmpty()) {
            return emptyMap()
        }

        return issueAssigneeRepository.findAllByIdIssueIdIn(issueIds)
            .groupBy({ it.id.issueId }, { it.id.memberId })
            .mapValues { (_, memberIds) -> memberIds.sorted() }
    }

    private fun replaceAssignees(issueId: Long, assigneeMemberIds: Collection<Long>) {
        issueAssigneeRepository.deleteAllByIdIssueId(issueId)
        issueAssigneeRepository.saveAllAndFlush(
            assigneeMemberIds.distinct().map { memberId ->
                IssueAssignee(
                    id = IssueAssigneeId(issueId = issueId, memberId = memberId),
                    createdDatetime = OffsetDateTime.now(),
                )
            },
        )
    }

    private fun loadActiveIssue(issueId: Long): Issue =
        issueRepository.findByIdAndIsEnabledTrueAndIsDeletedFalse(issueId)
            ?: throw InvalidIssueRequestException("Issue not found.")

    private fun normalizeTitle(rawTitle: String): String {
        val title = rawTitle.trim()
        if (title.isEmpty()) {
            throw InvalidIssueRequestException("Issue title is required.")
        }
        return title
    }

    private fun validatePage(page: Int): Int {
        if (page < 0) {
            throw InvalidIssueRequestException("page must be zero or greater.")
        }
        return page
    }

    private fun validateSize(size: Int): Int {
        if (size !in 1..MAX_ISSUE_SEARCH_SIZE) {
            throw InvalidIssueRequestException("size must be between 1 and $MAX_ISSUE_SEARCH_SIZE.")
        }
        return size
    }
}

private const val MAX_ISSUE_SEARCH_SIZE = 100
