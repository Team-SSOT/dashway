package ai.ssot.issuetracker.domain.issue.dto

import ai.ssot.issuetracker.domain.issue.entity.IssuePriority
import ai.ssot.issuetracker.domain.issue.entity.IssueStatus
import ai.ssot.issuetracker.generated.types.ArchiveIssueInput
import ai.ssot.issuetracker.generated.types.AttachIssueFilesInput
import ai.ssot.issuetracker.generated.types.CreateIssueCommentInput
import ai.ssot.issuetracker.generated.types.CreateIssueInput
import ai.ssot.issuetracker.generated.types.CreateLabelInput
import ai.ssot.issuetracker.generated.types.DeleteIssueCommentInput
import ai.ssot.issuetracker.generated.types.DeleteLabelInput
import ai.ssot.issuetracker.generated.types.DetachIssueFileInput
import ai.ssot.issuetracker.generated.types.IssuesInput
import ai.ssot.issuetracker.generated.types.UpdateIssueCommentInput
import ai.ssot.issuetracker.generated.types.UpdateIssueInput
import ai.ssot.issuetracker.generated.types.UpdateLabelInput
import ai.ssot.issuetracker.generated.types.Issue as GraphQlIssue
import ai.ssot.issuetracker.generated.types.IssueComment as GraphQlIssueComment
import ai.ssot.issuetracker.generated.types.IssuePage as GraphQlIssuePage
import ai.ssot.issuetracker.generated.types.IssuePriority as GraphQlIssuePriority
import ai.ssot.issuetracker.generated.types.IssueStatus as GraphQlIssueStatus
import ai.ssot.issuetracker.generated.types.Label as GraphQlLabel
import ai.ssot.issuetracker.generated.types.PageInfo as GraphQlPageInfo

fun IssuesInput.toDto(): IssueSearchDto =
    IssueSearchDto(
        projectIds = projectIds.orEmpty().map { it.toLong() },
        statuses = statuses.orEmpty().map { IssueStatus.valueOf(it.name) },
        priorities = priorities.orEmpty().map { IssuePriority.valueOf(it.name) },
        assigneeMemberIds = assigneeMemberIds.orEmpty().map { it.toLong() },
        labelIds = labelIds.orEmpty().map { it.toLong() },
        dueFrom = dueFrom,
        dueTo = dueTo,
        query = query,
        page = page,
        size = size,
    )

fun CreateIssueInput.toDto(): CreateIssueDto =
    CreateIssueDto(
        projectId = projectId,
        title = title,
        content = content,
        status = status?.let { IssueStatus.valueOf(it.name) },
        priority = priority?.let { IssuePriority.valueOf(it.name) },
        reporterMemberId = reporterMemberId,
        assigneeMemberIds = assigneeMemberIds.orEmpty().map { it.toLong() },
        labelIds = labelIds.orEmpty().map { it.toLong() },
        fileIds = fileIds.orEmpty(),
        dueDatetime = dueDatetime,
    )

fun UpdateIssueInput.toDto(): UpdateIssueDto =
    UpdateIssueDto(
        issueId = issueId,
        title = title,
        content = content,
        status = status?.let { IssueStatus.valueOf(it.name) },
        priority = priority?.let { IssuePriority.valueOf(it.name) },
        reporterMemberId = reporterMemberId,
        assigneeMemberIds = assigneeMemberIds?.map { it.toLong() },
        labelIds = labelIds?.map { it.toLong() },
        dueDatetime = dueDatetime,
    )

fun ArchiveIssueInput.toDto(): ArchiveIssueDto =
    ArchiveIssueDto(issueId = issueId)

fun CreateIssueCommentInput.toDto(): CreateIssueCommentDto =
    CreateIssueCommentDto(
        issueId = issueId,
        content = content,
        fileIds = fileIds.orEmpty(),
    )

fun UpdateIssueCommentInput.toDto(): UpdateIssueCommentDto =
    UpdateIssueCommentDto(
        commentId = commentId,
        content = content,
    )

fun DeleteIssueCommentInput.toDto(): DeleteIssueCommentDto =
    DeleteIssueCommentDto(commentId = commentId)

fun CreateLabelInput.toDto(): CreateLabelDto =
    CreateLabelDto(
        projectId = projectId,
        name = name,
        color = color,
    )

fun UpdateLabelInput.toDto(): UpdateLabelDto =
    UpdateLabelDto(
        labelId = labelId,
        name = name,
        color = color,
    )

fun DeleteLabelInput.toDto(): DeleteLabelDto =
    DeleteLabelDto(labelId = labelId)

fun AttachIssueFilesInput.toDto(): AttachIssueFilesDto =
    AttachIssueFilesDto(
        issueId = issueId,
        fileIds = fileIds,
    )

fun DetachIssueFileInput.toDto(): DetachIssueFileDto =
    DetachIssueFileDto(
        issueId = issueId,
        fileId = fileId,
    )

fun IssueSearchResult.toGraphQL(): GraphQlIssuePage =
    GraphQlIssuePage(
        issues.map { it.toGraphQL() },
        GraphQlPageInfo(page, size, Math.toIntExact(totalElements), totalPages),
    )

fun IssueDto.toGraphQL(): GraphQlIssue =
    GraphQlIssue(
        id,
        key,
        projectId,
        title,
        content,
        GraphQlIssueStatus.valueOf(status.name),
        GraphQlIssuePriority.valueOf(priority.name),
        reporterMemberId,
        creatorMemberId,
        assigneeMemberIds,
        labels.map { it.toGraphQL() },
        comments.map { it.toGraphQL() },
        fileIds.map { it.toString() },
        dueDatetime,
        createdDatetime,
        updatedDatetime,
    )

fun LabelDto.toGraphQL(): GraphQlLabel =
    GraphQlLabel(
        id,
        projectId,
        name,
        color,
        createdDatetime,
        updatedDatetime,
    )

fun IssueCommentDto.toGraphQL(): GraphQlIssueComment =
    GraphQlIssueComment(
        id,
        issueId,
        authorMemberId,
        content,
        isDeleted,
        fileIds.map { it.toString() },
        createdDatetime,
        updatedDatetime,
        deletedDatetime,
    )
