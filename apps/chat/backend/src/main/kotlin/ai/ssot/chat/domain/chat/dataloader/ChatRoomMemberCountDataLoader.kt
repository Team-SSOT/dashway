package ai.ssot.chat.domain.chat.dataloader

import ai.ssot.chat.domain.chat.service.ChatRoomMemberService
import ai.ssot.chat.generated.DgsConstants
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsData
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment
import com.netflix.graphql.dgs.DgsDataLoader
import org.dataloader.MappedBatchLoader
import java.util.*
import java.util.concurrent.CompletableFuture
import java.util.concurrent.CompletionStage
import ai.ssot.chat.generated.types.ChatRoom as GraphQlChatRoom

const val CHAT_ROOM_MEMBER_COUNT_DATA_LOADER = "chatRoomMemberCount"

@DgsDataLoader(name = CHAT_ROOM_MEMBER_COUNT_DATA_LOADER)
class ChatRoomMemberCountDataLoader(
    private val chatRoomMemberService: ChatRoomMemberService,
) : MappedBatchLoader<UUID, Int> {
    override fun load(keys: Set<UUID>): CompletionStage<Map<UUID, Int>> {
        return CompletableFuture.completedFuture(
            chatRoomMemberService.getChatRoomMemberCounts(keys),
        )
    }
}

@DgsComponent
class ChatRoomMemberCountDataFetcher {
    @DgsData(parentType = DgsConstants.CHATROOM.TYPE_NAME, field = DgsConstants.CHATROOM.MemberCount)
    fun memberCount(environment: DgsDataFetchingEnvironment): CompletableFuture<Int> {
        val room = environment.getSourceOrThrow<GraphQlChatRoom>()
        val dataLoader = requireNotNull(
            environment.getDataLoader<UUID, Int>(CHAT_ROOM_MEMBER_COUNT_DATA_LOADER),
        )

        return dataLoader.load(UUID.fromString(room.id))
    }
}
