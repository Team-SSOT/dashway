package ai.ssot.contextapi.domain.auth.dataloader

import ai.ssot.contextapi.domain.auth.service.MemberAuthorityService
import ai.ssot.contextapi.generated.types.Authority
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsDataLoader
import org.dataloader.MappedBatchLoader
import java.util.concurrent.CompletableFuture
import java.util.concurrent.CompletionStage

@DgsComponent
@DgsDataLoader
class MemberAuthoritiesDataLoader(
    private val memberAuthorityService: MemberAuthorityService
) : MappedBatchLoader<Long, List<Authority>> {

    override fun load(keys: Set<Long>): CompletionStage<Map<Long, List<Authority>>> {
        if (keys.isEmpty()) {
            return CompletableFuture.completedFuture(emptyMap())
        }

        val memberIdToAuthorities = memberAuthorityService.getMemberIdToAuthorities(keys.toList())

        return CompletableFuture.completedFuture(
            keys.associateWith { memberId ->
                memberIdToAuthorities[memberId]
                    ?.map { Authority(it.id!!, it.name) }
                    .orEmpty()
            }
        )
    }
}
