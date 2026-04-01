package ai.ssot.contextapi.domain.team.dataloader

import ai.ssot.contextapi.domain.team.service.TeamMemberService
import ai.ssot.contextapi.generated.types.Member
import com.netflix.graphql.dgs.DgsDataLoader
import org.dataloader.MappedBatchLoader
import org.springframework.stereotype.Component
import java.util.concurrent.CompletableFuture
import java.util.concurrent.CompletionStage

@Component
@DgsDataLoader
class TeamMemberDataLoader(
    private val teamMemberService: TeamMemberService
): MappedBatchLoader<Long, Collection<Member>> {
    override fun load(keys: Set<Long>): CompletionStage<Map<Long, Collection<Member>>> {
        if(keys.isEmpty()) return CompletableFuture.completedFuture(emptyMap())

        val teamIdToMembers = teamMemberService.getTeamIdToMembers(keys.toList())

        return CompletableFuture.completedFuture(
            keys.associateWith { teamId ->
                teamIdToMembers[teamId]
                    ?.map { Member(it.id!!, it.name, it.email, null, it.isEnabled, it.createdDatetime) }
                    ?: emptyList()
            }
        )
    }
}
