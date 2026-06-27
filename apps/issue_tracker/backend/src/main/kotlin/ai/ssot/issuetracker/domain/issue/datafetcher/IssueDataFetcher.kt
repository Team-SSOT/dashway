package ai.ssot.issuetracker.domain.issue.datafetcher

import ai.ssot.issuetracker.config.auth.withMemberId
import ai.ssot.issuetracker.domain.issue.dto.toDto
import ai.ssot.issuetracker.domain.issue.dto.toGraphQL
import ai.ssot.issuetracker.domain.issue.service.IssueCommentService
import ai.ssot.issuetracker.domain.issue.service.IssueLabelService
import ai.ssot.issuetracker.domain.issue.service.IssueService
import ai.ssot.issuetracker.generated.types.ArchiveIssueInput
import ai.ssot.issuetracker.generated.types.AttachIssueFilesInput
import ai.ssot.issuetracker.generated.types.CreateIssueCommentInput
import ai.ssot.issuetracker.generated.types.CreateIssueInput
import ai.ssot.issuetracker.generated.types.CreateLabelInput
import ai.ssot.issuetracker.generated.types.DeleteIssueCommentInput
import ai.ssot.issuetracker.generated.types.DeleteLabelInput
import ai.ssot.issuetracker.generated.types.DetachIssueFileInput
import ai.ssot.issuetracker.generated.types.Issue
import ai.ssot.issuetracker.generated.types.IssueComment
import ai.ssot.issuetracker.generated.types.IssuePage
import ai.ssot.issuetracker.generated.types.IssuesInput
import ai.ssot.issuetracker.generated.types.Label
import ai.ssot.issuetracker.generated.types.UpdateIssueCommentInput
import ai.ssot.issuetracker.generated.types.UpdateIssueInput
import ai.ssot.issuetracker.generated.types.UpdateLabelInput
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class IssueDataFetcher(
    private val issueService: IssueService,
    private val issueLabelService: IssueLabelService,
    private val issueCommentService: IssueCommentService,
) {
    @DgsQuery
    fun issues(
        @InputArgument input: IssuesInput,
    ): IssuePage =
        withMemberId { memberId ->
            issueService.getIssues(memberId, input.toDto()).toGraphQL()
        }

    @DgsQuery
    fun issue(
        @InputArgument id: Long,
    ): Issue? =
        withMemberId { memberId ->
            issueService.getIssue(memberId, id)?.toGraphQL()
        }

    @DgsQuery
    fun labels(
        @InputArgument projectId: Long,
    ): List<Label> =
        withMemberId { memberId ->
            issueLabelService.getLabels(memberId, projectId).map { it.toGraphQL() }
        }

    @DgsMutation
    fun createIssue(
        @InputArgument input: CreateIssueInput,
    ): Issue =
        withMemberId { memberId ->
            issueService.createIssue(memberId, input.toDto()).toGraphQL()
        }

    @DgsMutation
    fun updateIssue(
        @InputArgument input: UpdateIssueInput,
    ): Issue =
        withMemberId { memberId ->
            issueService.updateIssue(memberId, input.toDto()).toGraphQL()
        }

    @DgsMutation
    fun archiveIssue(
        @InputArgument input: ArchiveIssueInput,
    ): Boolean =
        withMemberId { memberId ->
            issueService.archiveIssue(memberId, input.toDto())
        }

    @DgsMutation
    fun createIssueComment(
        @InputArgument input: CreateIssueCommentInput,
    ): IssueComment =
        withMemberId { memberId ->
            issueCommentService.createIssueComment(memberId, input.toDto()).toGraphQL()
        }

    @DgsMutation
    fun updateIssueComment(
        @InputArgument input: UpdateIssueCommentInput,
    ): IssueComment =
        withMemberId { memberId ->
            issueCommentService.updateIssueComment(memberId, input.toDto()).toGraphQL()
        }

    @DgsMutation
    fun deleteIssueComment(
        @InputArgument input: DeleteIssueCommentInput,
    ): Boolean =
        withMemberId { memberId ->
            issueCommentService.deleteIssueComment(memberId, input.toDto())
        }

    @DgsMutation
    fun createLabel(
        @InputArgument input: CreateLabelInput,
    ): Label =
        withMemberId { memberId ->
            issueLabelService.createLabel(memberId, input.toDto()).toGraphQL()
        }

    @DgsMutation
    fun updateLabel(
        @InputArgument input: UpdateLabelInput,
    ): Label =
        withMemberId { memberId ->
            issueLabelService.updateLabel(memberId, input.toDto()).toGraphQL()
        }

    @DgsMutation
    fun deleteLabel(
        @InputArgument input: DeleteLabelInput,
    ): Boolean =
        withMemberId { memberId ->
            issueLabelService.deleteLabel(memberId, input.toDto())
        }

    @DgsMutation
    fun attachIssueFiles(
        @InputArgument input: AttachIssueFilesInput,
    ): Issue =
        withMemberId { memberId ->
            issueService.attachIssueFiles(memberId, input.toDto()).toGraphQL()
        }

    @DgsMutation
    fun detachIssueFile(
        @InputArgument input: DetachIssueFileInput,
    ): Issue =
        withMemberId { memberId ->
            issueService.detachIssueFile(memberId, input.toDto()).toGraphQL()
        }
}
