package ai.ssot.chat.domain.chat.controller

import ai.ssot.chat.domain.chat.service.ChatRoomService
import ai.ssot.chat.generated.DgsConstants
import ai.ssot.chat.generated.types.ChatRoom as GraphQlChatRoom
import ai.ssot.chat.generated.types.ChatRoomMember as GraphQlChatRoomMember
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsData
import com.netflix.graphql.dgs.DgsDataFetchingEnvironment
import com.netflix.graphql.dgs.DgsDataLoader
import org.dataloader.MappedBatchLoader
import java.util.UUID
import java.util.concurrent.CompletableFuture
import java.util.concurrent.CompletionStage

const val CHAT_ROOM_MEMBERS_DATA_LOADER = "chatRoomMembers"

@DgsDataLoader(name = CHAT_ROOM_MEMBERS_DATA_LOADER)
class ChatRoomMembersDataLoader(
    private val chatRoomService: ChatRoomService,
) : MappedBatchLoader<String, List<GraphQlChatRoomMember>> {
    override fun load(keys: Set<String>): CompletionStage<Map<String, List<GraphQlChatRoomMember>>> {
        val roomIdsByKey = keys.associateWith { UUID.fromString(it) }
        val membersByRoomId = chatRoomService.getChatRoomMembers(roomIdsByKey.values.toSet())

        return CompletableFuture.completedFuture(
            roomIdsByKey.mapValues { (_, roomId) ->
                membersByRoomId[roomId].orEmpty().map { it.toGraphQL() }
            },
        )
    }
}

@DgsComponent
class ChatRoomMembersDataFetcher {
    @DgsData(parentType = DgsConstants.CHATROOM.TYPE_NAME, field = DgsConstants.CHATROOM.Members)
    fun members(environment: DgsDataFetchingEnvironment): CompletableFuture<List<GraphQlChatRoomMember>> {
        val room = environment.getSourceOrThrow<GraphQlChatRoom>()
        val dataLoader = requireNotNull(
            environment.getDataLoader<String, List<GraphQlChatRoomMember>>(CHAT_ROOM_MEMBERS_DATA_LOADER),
        )

        return dataLoader.load(room.id)
    }
}
