package ai.ssot.chat.domain.chat.dataloader

import ai.ssot.chat.config.auth.withMemberId
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

const val CHAT_ROOM_CAN_DELETE_DATA_LOADER = "chatRoomCanDelete"

data class ChatRoomCanDeleteDataLoaderKey(
    val roomId: UUID,
    val memberId: Long,
)

@DgsDataLoader(name = CHAT_ROOM_CAN_DELETE_DATA_LOADER)
class ChatRoomCanDeleteDataLoader(
    private val chatRoomMemberService: ChatRoomMemberService,
) : MappedBatchLoader<ChatRoomCanDeleteDataLoaderKey, Boolean> {
    override fun load(
        keys: Set<ChatRoomCanDeleteDataLoaderKey>,
    ): CompletionStage<Map<ChatRoomCanDeleteDataLoaderKey, Boolean>> {
        val canDeleteByKey = keys.groupBy { it.memberId }
            .flatMap { (memberId, memberKeys) ->
                val roomIds = memberKeys.map { it.roomId }.toSet()
                val canDeleteByRoomId = chatRoomMemberService.getChatRoomCanDeleteByRoomIds(
                    memberId = memberId,
                    roomIds = roomIds,
                )

                memberKeys.map { key ->
                    key to (canDeleteByRoomId[key.roomId] ?: false)
                }
            }
            .toMap()

        return CompletableFuture.completedFuture(canDeleteByKey)
    }
}

@DgsComponent
class ChatRoomCanDeleteDataFetcher {
    @DgsData(parentType = DgsConstants.CHATROOM.TYPE_NAME, field = DgsConstants.CHATROOM.CanDelete)
    fun canDelete(environment: DgsDataFetchingEnvironment): CompletableFuture<Boolean> {
        val room = environment.getSourceOrThrow<GraphQlChatRoom>()
        val dataLoader = requireNotNull(
            environment.getDataLoader<ChatRoomCanDeleteDataLoaderKey, Boolean>(
                CHAT_ROOM_CAN_DELETE_DATA_LOADER,
            ),
        )

        return withMemberId { memberId ->
            dataLoader.load(
                ChatRoomCanDeleteDataLoaderKey(
                    roomId = UUID.fromString(room.id),
                    memberId = memberId,
                ),
            )
        }
    }
}
