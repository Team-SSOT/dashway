package ai.ssot.issuetracker.domain.issue.dataloader

import ai.ssot.issuetracker.domain.issue.service.IssueFileService
import ai.ssot.issuetracker.generated.types.Issue
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsData
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment
import com.netflix.graphql.dgs.DgsDataLoader
import org.dataloader.MappedBatchLoader
import java.util.concurrent.CompletableFuture
import java.util.concurrent.CompletionStage

const val ISSUE_FILE_IDS_DATA_LOADER = "issueFileIds"

@DgsDataLoader(name = ISSUE_FILE_IDS_DATA_LOADER)
class IssueFileIdsDataLoader(
    private val issueFileService: IssueFileService,
) : MappedBatchLoader<Long, List<String>> {
    override fun load(keys: Set<Long>): CompletionStage<Map<Long, List<String>>> {
        val fileIdsByIssueId = issueFileService.getIssueFileIdsByIssueIds(keys)
        return CompletableFuture.completedFuture(
            keys.associateWith { issueId -> fileIdsByIssueId[issueId].orEmpty().map { it.toString() } },
        )
    }
}

@DgsComponent
class IssueFileIdsDataFetcher {
    @DgsData(parentType = "Issue", field = "fileIds")
    fun fileIds(environment: DgsDataFetchingEnvironment): CompletableFuture<List<String>> {
        val issue = environment.getSourceOrThrow<Issue>()
        val dataLoader = requireNotNull(
            environment.getDataLoader<Long, List<String>>(ISSUE_FILE_IDS_DATA_LOADER),
        )

        return dataLoader.load(issue.id)
    }
}
