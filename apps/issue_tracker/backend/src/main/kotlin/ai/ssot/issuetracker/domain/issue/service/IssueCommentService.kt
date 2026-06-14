package ai.ssot.issuetracker.domain.issue.service

import ai.ssot.issuetracker.domain.issue.dto.CreateIssueCommentDto
import ai.ssot.issuetracker.domain.issue.dto.DeleteIssueCommentDto
import ai.ssot.issuetracker.domain.issue.dto.IssueCommentDto
import ai.ssot.issuetracker.domain.issue.dto.UpdateIssueCommentDto
import ai.ssot.issuetracker.domain.issue.dto.toDto
import ai.ssot.issuetracker.domain.issue.entity.Issue
import ai.ssot.issuetracker.domain.issue.entity.IssueComment
import ai.ssot.issuetracker.domain.issue.exception.InvalidIssueRequestException
import ai.ssot.issuetracker.domain.issue.repository.IssueCommentRepository
import ai.ssot.issuetracker.domain.issue.repository.IssueRepository
import ai.ssot.issuetracker.domain.project.service.ProjectMemberService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

@Service
class IssueCommentService(
    private val issueRepository: IssueRepository,
    private val issueCommentRepository: IssueCommentRepository,
    private val issueFileService: IssueFileService,
    private val projectMemberService: ProjectMemberService,
) {
    @Transactional
    fun createIssueComment(memberId: Long, dto: CreateIssueCommentDto): IssueCommentDto {
        val issue = loadActiveIssue(dto.issueId)
        projectMemberService.validateProjectMember(issue.projectId, memberId)
        val content = normalizeContent(dto.content)
        val now = OffsetDateTime.now()

        val comment = issueCommentRepository.saveAndFlush(
            IssueComment(
                issueId = dto.issueId,
                authorMemberId = memberId,
                content = content,
                createdDatetime = now,
                updatedDatetime = now,
            ),
        )
        issueFileService.replaceCommentFiles(requireNotNull(comment.id), dto.fileIds)
        return comment.toDto(
            fileIds = issueFileService.getCommentFileIdsByCommentIds(listOf(requireNotNull(comment.id)))
                .getOrDefault(requireNotNull(comment.id), emptyList()),
        )
    }

    @Transactional
    fun updateIssueComment(memberId: Long, dto: UpdateIssueCommentDto): IssueCommentDto {
        val comment = loadEnabledComment(dto.commentId)
        if (comment.isDeleted) {
            throw InvalidIssueRequestException("Comment was deleted.")
        }
        val issue = loadActiveIssue(comment.issueId)
        projectMemberService.validateProjectMember(issue.projectId, memberId)
        validateCommentAuthor(comment, memberId)

        comment.content = normalizeContent(dto.content)
        comment.updatedDatetime = OffsetDateTime.now()
        return comment.toDto(
            fileIds = issueFileService.getCommentFileIdsByCommentIds(listOf(dto.commentId))[dto.commentId].orEmpty(),
        )
    }

    @Transactional
    fun deleteIssueComment(memberId: Long, dto: DeleteIssueCommentDto): Boolean {
        val comment = loadEnabledComment(dto.commentId)
        val issue = loadActiveIssue(comment.issueId)
        projectMemberService.validateProjectMember(issue.projectId, memberId)
        validateCommentAuthor(comment, memberId)

        if (comment.isDeleted) {
            return true
        }

        val now = OffsetDateTime.now()
        comment.isDeleted = true
        comment.updatedDatetime = now
        comment.deletedDatetime = now
        return true
    }

    @Transactional(readOnly = true)
    fun getCommentsByIssueIds(issueIds: Collection<Long>): Map<Long, List<IssueCommentDto>> {
        if (issueIds.isEmpty()) {
            return emptyMap()
        }

        val comments = issueCommentRepository.findAllByIssueIdInAndIsEnabledTrueOrderByCreatedDatetimeAscIdAsc(issueIds)
        val fileIdsByCommentId = issueFileService.getCommentFileIdsByCommentIds(comments.mapNotNull { it.id })

        return comments.groupBy { it.issueId }
            .mapValues { (_, issueComments) ->
                issueComments.map { comment ->
                    comment.toDto(fileIds = fileIdsByCommentId[requireNotNull(comment.id)].orEmpty())
                }
            }
    }

    private fun loadActiveIssue(issueId: Long): Issue =
        issueRepository.findByIdAndIsEnabledTrueAndIsDeletedFalse(issueId)
            ?: throw InvalidIssueRequestException("Issue not found.")

    private fun loadEnabledComment(commentId: Long): IssueComment =
        issueCommentRepository.findByIdAndIsEnabledTrue(commentId)
            ?: throw InvalidIssueRequestException("Comment not found.")

    private fun validateCommentAuthor(comment: IssueComment, memberId: Long) {
        if (comment.authorMemberId != memberId) {
            throw InvalidIssueRequestException("Comment author is required.")
        }
    }

    private fun normalizeContent(rawContent: String): String {
        val content = rawContent.trim()
        if (content.isEmpty()) {
            throw InvalidIssueRequestException("Comment content is required.")
        }
        return content
    }
}
