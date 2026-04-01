package ai.ssot.contextapi.domain.auth.controller

import ai.ssot.contextapi.domain.auth.dataloader.MemberAuthoritiesDataLoader
import ai.ssot.contextapi.generated.types.Authority
import ai.ssot.contextapi.generated.types.Member
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsData
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment
import java.util.concurrent.CompletableFuture

@DgsComponent
class AuthorityDataFetcher {
    @DgsData(parentType = "Member", field = "authorities")
    fun authorities(dfe: DgsDataFetchingEnvironment): CompletableFuture<List<Authority>> {
        val source = dfe.getSourceOrThrow<Member>()
        return dfe.getDataLoader<Long, List<Authority>>(MemberAuthoritiesDataLoader::class.java)
            .load(source.id)
    }
}