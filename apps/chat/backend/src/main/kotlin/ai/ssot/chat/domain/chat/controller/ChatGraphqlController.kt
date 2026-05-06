package ai.ssot.chat.domain.chat.controller

import ai.ssot.chat.config.auth.withMemberId
import ai.ssot.chat.domain.chat.service.ChatRoomService
import ai.ssot.chat.generated.types.ChatRoom
import ai.ssot.chat.generated.types.CreateChatRoomInput
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class ChatGraphqlController(
    private val chatRoomService: ChatRoomService,
) {
    @DgsMutation
    fun createChatRoom(
        @InputArgument input: CreateChatRoomInput,
    ): ChatRoom {
        return withMemberId { memberId ->
            chatRoomService.createChatRoom(
                memberId = memberId,
                dto = input.toDto(),
            ).toGraphQL(memberId)
        }
    }
}
