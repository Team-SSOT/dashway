package ai.ssot.issuetracker.domain.issue.dataloader

import ai.ssot.issuetracker.domain.issue.dto.toGraphQL
import ai.ssot.issuetracker.domain.issue.service.IssueCommentService
import ai.ssot.issuetracker.generated.types.Issue
import ai.ssot.issuetracker.generated.types.IssueComment
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsData
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment
import com.netflix.graphql.dgs.DgsDataLoader
import org.dataloader.MappedBatchLoader
import java.util.concurrent.CompletableFuture
import java.util.concurrent.CompletionStage

const val ISSUE_COMMENTS_DATA_LOADER = "issueComments"

@DgsDataLoader(name = ISSUE_COMMENTS_DATA_LOADER)
class IssueCommentsDataLoader(
    private val issueCommentService: IssueCommentService,
) : MappedBatchLoader<Long, List<IssueComment>> {
    override fun load(keys: Set<Long>): CompletionStage<Map<Long, List<IssueComment>>> {
        val commentsByIssueId = issueCommentService.getCommentsByIssueIds(keys)
        return CompletableFuture.completedFuture(
            keys.associateWith { issueId -> commentsByIssueId[issueId].orEmpty().map { it.toGraphQL() } },
        )
    }
}

@DgsComponent
class IssueCommentsDataFetcher {
    @DgsData(parentType = "Issue", field = "comments")
    fun comments(environment: DgsDataFetchingEnvironment): CompletableFuture<List<IssueComment>> {
        val issue = environment.getSourceOrThrow<Issue>()
        val dataLoader = requireNotNull(
            environment.getDataLoader<Long, List<IssueComment>>(ISSUE_COMMENTS_DATA_LOADER),
        )

        return dataLoader.load(issue.id)
    }
}
