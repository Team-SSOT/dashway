package ai.ssot.issuetracker.domain.issue.dataloader

import ai.ssot.issuetracker.domain.issue.dto.toGraphQL
import ai.ssot.issuetracker.domain.issue.service.IssueLabelService
import ai.ssot.issuetracker.generated.types.Issue
import ai.ssot.issuetracker.generated.types.Label
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsData
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment
import com.netflix.graphql.dgs.DgsDataLoader
import org.dataloader.MappedBatchLoader
import java.util.concurrent.CompletableFuture
import java.util.concurrent.CompletionStage

const val ISSUE_LABELS_DATA_LOADER = "issueLabels"

@DgsDataLoader(name = ISSUE_LABELS_DATA_LOADER)
class IssueLabelsDataLoader(
    private val issueLabelService: IssueLabelService,
) : MappedBatchLoader<Long, List<Label>> {
    override fun load(keys: Set<Long>): CompletionStage<Map<Long, List<Label>>> {
        val labelsByIssueId = issueLabelService.getLabelsByIssueIds(keys)
        return CompletableFuture.completedFuture(
            keys.associateWith { issueId -> labelsByIssueId[issueId].orEmpty().map { it.toGraphQL() } },
        )
    }
}

@DgsComponent
class IssueLabelsDataFetcher {
    @DgsData(parentType = "Issue", field = "labels")
    fun labels(environment: DgsDataFetchingEnvironment): CompletableFuture<List<Label>> {
        val issue = environment.getSourceOrThrow<Issue>()
        val dataLoader = requireNotNull(
            environment.getDataLoader<Long, List<Label>>(ISSUE_LABELS_DATA_LOADER),
        )

        return dataLoader.load(issue.id)
    }
}
