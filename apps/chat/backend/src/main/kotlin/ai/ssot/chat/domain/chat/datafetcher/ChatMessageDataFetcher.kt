package ai.ssot.chat.domain.chat.datafetcher

import ai.ssot.chat.config.auth.withMemberId
import ai.ssot.chat.domain.chat.service.ChatMessageService
import ai.ssot.chat.generated.types.ChatMessageCursor
import ai.ssot.chat.generated.types.ChatMessagesInput
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsQuery
import java.util.*

@DgsComponent
class ChatMessageDataFetcher(
    private val chatMessageService: ChatMessageService,
) {

    @DgsQuery
    fun chatMessages(input: ChatMessagesInput): ChatMessageCursor {
        return withMemberId {
            chatMessageService.findCursorResult(
                roomId = UUID.fromString(input.roomId),
                size = input.size,
                cursor = input.cursor
            ).toGraphQL()
        }
    }
}