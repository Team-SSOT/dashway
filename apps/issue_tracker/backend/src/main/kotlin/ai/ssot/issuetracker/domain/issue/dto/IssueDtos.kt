package ai.ssot.issuetracker.domain.issue.dto

import ai.ssot.issuetracker.domain.issue.entity.Issue
import ai.ssot.issuetracker.domain.issue.entity.IssueComment
import ai.ssot.issuetracker.domain.issue.entity.IssuePriority
import ai.ssot.issuetracker.domain.issue.entity.IssueStatus
import ai.ssot.issuetracker.domain.issue.entity.Label
import java.time.OffsetDateTime
import java.util.UUID

data class IssueSearchDto(
    val projectIds: List<Long>,
    val statuses: List<IssueStatus>,
    val priorities: List<IssuePriority>,
    val assigneeMemberIds: List<Long>,
    val labelIds: List<Long>,
    val dueFrom: OffsetDateTime?,
    val dueTo: OffsetDateTime?,
    val query: String?,
    val page: Int,
    val size: Int,
)

data class IssueSearchResult(
    val issues: List<IssueDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)

data class CreateIssueDto(
    val projectId: Long,
    val title: String,
    val content: String?,
    val status: IssueStatus?,
    val priority: IssuePriority?,
    val reporterMemberId: Long?,
    val assigneeMemberIds: List<Long>,
    val labelIds: List<Long>,
    val fileIds: List<String>,
    val dueDatetime: OffsetDateTime?,
)

data class UpdateIssueDto(
    val issueId: Long,
    val title: String?,
    val content: String?,
    val status: IssueStatus?,
    val priority: IssuePriority?,
    val reporterMemberId: Long?,
    val assigneeMemberIds: List<Long>?,
    val labelIds: List<Long>?,
    val dueDatetime: OffsetDateTime?,
)

data class ArchiveIssueDto(
    val issueId: Long,
)

data class CreateIssueCommentDto(
    val issueId: Long,
    val content: String,
    val fileIds: List<String>,
)

data class UpdateIssueCommentDto(
    val commentId: Long,
    val content: String,
)

data class DeleteIssueCommentDto(
    val commentId: Long,
)

data class CreateLabelDto(
    val projectId: Long,
    val name: String,
    val color: String,
)

data class UpdateLabelDto(
    val labelId: Long,
    val name: String?,
    val color: String?,
)

data class DeleteLabelDto(
    val labelId: Long,
)

data class AttachIssueFilesDto(
    val issueId: Long,
    val fileIds: List<String>,
)

data class DetachIssueFileDto(
    val issueId: Long,
    val fileId: String,
)

data class IssueDto(
    val id: Long,
    val projectId: Long,
    val projectKey: String,
    val title: String,
    val content: String?,
    val status: IssueStatus,
    val priority: IssuePriority,
    val reporterMemberId: Long,
    val creatorMemberId: Long,
    val assigneeMemberIds: List<Long>,
    val labels: List<LabelDto>,
    val comments: List<IssueCommentDto>,
    val fileIds: List<UUID>,
    val dueDatetime: OffsetDateTime?,
    val createdDatetime: OffsetDateTime,
    val updatedDatetime: OffsetDateTime,
) {
    val key: String = "$projectKey-$id"
}

data class IssueBaseDto(
    val id: Long,
    val projectId: Long,
    val projectKey: String,
    val title: String,
    val content: String?,
    val status: IssueStatus,
    val priority: IssuePriority,
    val reporterMemberId: Long,
    val creatorMemberId: Long,
    val dueDatetime: OffsetDateTime?,
    val createdDatetime: OffsetDateTime,
    val updatedDatetime: OffsetDateTime,
)

data class LabelDto(
    val id: Long,
    val projectId: Long,
    val name: String,
    val color: String,
    val createdDatetime: OffsetDateTime,
    val updatedDatetime: OffsetDateTime,
)

data class IssueCommentDto(
    val id: Long,
    val issueId: Long,
    val authorMemberId: Long,
    val content: String?,
    val isDeleted: Boolean,
    val fileIds: List<UUID>,
    val createdDatetime: OffsetDateTime,
    val updatedDatetime: OffsetDateTime,
    val deletedDatetime: OffsetDateTime?,
)

fun IssueBaseDto.toIssueDto(
    assigneeMemberIds: List<Long> = emptyList(),
    labels: List<LabelDto> = emptyList(),
    comments: List<IssueCommentDto> = emptyList(),
    fileIds: List<UUID> = emptyList(),
): IssueDto =
    IssueDto(
        id = id,
        projectId = projectId,
        projectKey = projectKey,
        title = title,
        content = content,
        status = status,
        priority = priority,
        reporterMemberId = reporterMemberId,
        creatorMemberId = creatorMemberId,
        assigneeMemberIds = assigneeMemberIds,
        labels = labels,
        comments = comments,
        fileIds = fileIds,
        dueDatetime = dueDatetime,
        createdDatetime = createdDatetime,
        updatedDatetime = updatedDatetime,
    )

fun Issue.toBaseDto(projectKey: String): IssueBaseDto =
    IssueBaseDto(
        id = requireNotNull(id),
        projectId = projectId,
        projectKey = projectKey,
        title = title,
        content = content,
        status = status,
        priority = priority,
        reporterMemberId = reporterMemberId,
        creatorMemberId = creatorMemberId,
        dueDatetime = dueDatetime,
        createdDatetime = createdDatetime,
        updatedDatetime = updatedDatetime,
    )

fun Label.toDto(): LabelDto =
    LabelDto(
        id = requireNotNull(id),
        projectId = projectId,
        name = name,
        color = color,
        createdDatetime = createdDatetime,
        updatedDatetime = updatedDatetime,
    )

fun IssueComment.toDto(fileIds: List<UUID> = emptyList()): IssueCommentDto =
    IssueCommentDto(
        id = requireNotNull(id),
        issueId = issueId,
        authorMemberId = authorMemberId,
        content = if (isDeleted) null else content,
        isDeleted = isDeleted,
        fileIds = fileIds,
        createdDatetime = createdDatetime,
        updatedDatetime = updatedDatetime,
        deletedDatetime = deletedDatetime,
    )
