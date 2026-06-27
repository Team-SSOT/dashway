package ai.ssot.issuetracker.domain.issue.dataloader

import ai.ssot.issuetracker.domain.issue.service.IssueService
import ai.ssot.issuetracker.generated.types.Issue
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsData
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment
import com.netflix.graphql.dgs.DgsDataLoader
import org.dataloader.MappedBatchLoader
import java.util.concurrent.CompletableFuture
import java.util.concurrent.CompletionStage

const val ISSUE_ASSIGNEE_MEMBER_IDS_DATA_LOADER = "issueAssigneeMemberIds"

@DgsDataLoader(name = ISSUE_ASSIGNEE_MEMBER_IDS_DATA_LOADER)
class IssueAssigneeMemberIdsDataLoader(
    private val issueService: IssueService,
) : MappedBatchLoader<Long, List<Long>> {
    override fun load(keys: Set<Long>): CompletionStage<Map<Long, List<Long>>> {
        val assigneeMemberIdsByIssueId = issueService.getAssigneeMemberIdsByIssueIds(keys)
        return CompletableFuture.completedFuture(
            keys.associateWith { issueId -> assigneeMemberIdsByIssueId[issueId].orEmpty() },
        )
    }
}

@DgsComponent
class IssueAssigneeMemberIdsDataFetcher {
    @DgsData(parentType = "Issue", field = "assigneeMemberIds")
    fun assigneeMemberIds(environment: DgsDataFetchingEnvironment): CompletableFuture<List<Long>> {
        val issue = environment.getSourceOrThrow<Issue>()
        val dataLoader = requireNotNull(
            environment.getDataLoader<Long, List<Long>>(ISSUE_ASSIGNEE_MEMBER_IDS_DATA_LOADER),
        )

        return dataLoader.load(issue.id)
    }
}
