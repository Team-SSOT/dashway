package ai.ssot.chat.domain.chat.datafetcher

import ai.ssot.chat.config.auth.withMemberId
import ai.ssot.chat.domain.chat.dto.toDto
import ai.ssot.chat.domain.chat.dto.toGraphQL
import ai.ssot.chat.domain.chat.service.ChatMessageService
import ai.ssot.chat.generated.types.ChatMessageCursor
import ai.ssot.chat.generated.types.ChatMessagesInput
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class ChatMessageDataFetcher(
    private val chatMessageService: ChatMessageService,
) {

    @DgsQuery
    fun chatMessages(
        @InputArgument input: ChatMessagesInput,
    ): ChatMessageCursor {
        return withMemberId { memberId ->
            chatMessageService.getChatMessages(
                memberId = memberId,
                dto = input.toDto(),
            ).toGraphQL()
        }
    }
}