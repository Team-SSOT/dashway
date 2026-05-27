package ai.ssot.chat.domain.chat.datafetcher

import ai.ssot.chat.config.auth.withMemberId
import ai.ssot.chat.domain.chat.dto.toDto
import ai.ssot.chat.domain.chat.dto.toGraphQL
import ai.ssot.chat.domain.chat.service.ChatRoomService
import ai.ssot.chat.generated.types.ChatRoom
import ai.ssot.chat.generated.types.ChatRoomPage
import ai.ssot.chat.generated.types.ChatRoomsInput
import ai.ssot.chat.generated.types.CreateChatRoomInput
import ai.ssot.chat.generated.types.DeleteChatRoomInput
import ai.ssot.chat.generated.types.SetChatRoomFavoriteInput
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class ChatRoomDataFetcher(
    private val chatRoomService: ChatRoomService,
) {
    @DgsQuery
    fun chatRooms(
        @InputArgument input: ChatRoomsInput,
    ): ChatRoomPage {
        return withMemberId { memberId ->
            chatRoomService.getChatRooms(
                memberId = memberId,
                dto = input.toDto(),
            ).toGraphQL()
        }
    }

    @DgsMutation
    fun createChatRoom(
        @InputArgument input: CreateChatRoomInput,
    ): ChatRoom {
        return withMemberId { memberId ->
            chatRoomService.createChatRoom(
                memberId = memberId,
                dto = input.toDto(),
            ).toGraphQL()
        }
    }

    @DgsMutation
    fun deleteChatRoom(
        @InputArgument input: DeleteChatRoomInput,
    ): Boolean {
        return withMemberId { memberId ->
            chatRoomService.deleteChatRoom(
                memberId = memberId,
                dto = input.toDto(),
            )
        }
    }

    @DgsMutation
    fun setChatRoomFavorite(
        @InputArgument input: SetChatRoomFavoriteInput,
    ): ChatRoom {
        return withMemberId { memberId ->
            chatRoomService.setChatRoomFavorite(
                memberId = memberId,
                dto = input.toDto(),
            ).toGraphQL()
        }
    }
}
