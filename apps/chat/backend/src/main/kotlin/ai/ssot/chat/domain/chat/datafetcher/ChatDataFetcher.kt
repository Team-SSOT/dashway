package ai.ssot.chat.domain.chat.datafetcher

import ai.ssot.chat.config.auth.withMemberId
import ai.ssot.chat.domain.chat.dto.toDto
import ai.ssot.chat.domain.chat.dto.toGraphQL
import ai.ssot.chat.domain.chat.service.ChatMessageService
import ai.ssot.chat.domain.chat.service.ChatRoomService
import ai.ssot.chat.generated.types.ChatMessageSlice
import ai.ssot.chat.generated.types.ChatMessagesInput
import ai.ssot.chat.generated.types.ChatRoom
import ai.ssot.chat.generated.types.ChatRoomPage
import ai.ssot.chat.generated.types.ChatRoomsInput
import ai.ssot.chat.generated.types.CreateChatRoomInput
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class ChatDataFetcher(
    private val chatRoomService: ChatRoomService,
    private val chatMessageService: ChatMessageService,
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

    @DgsQuery
    fun chatMessages(
        @InputArgument input: ChatMessagesInput,
    ): ChatMessageSlice {
        return withMemberId { memberId ->
            chatMessageService.getChatMessages(
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
}
