package ai.ssot.chat.domain.chat.dto

import ai.ssot.chat.domain.chat.entity.ChatMessage
import ai.ssot.chat.generated.types.ChatMessageCursor
import com.querydsl.core.annotations.QueryProjection
import java.time.OffsetDateTime
import java.util.*
import ai.ssot.chat.generated.types.ChatMessage as ChatMessageQL

data class ChatMessageCursorResult (
    val messages: List<ChatMessageDto>,
    val hasNext: Boolean,
    val nextCursor: Long?,
) {
    fun toGraphQL(): ChatMessageCursor {
        return ChatMessageCursor(
            messages.map { it.toGraphQL() },
            hasNext,
            nextCursor,
        )
    }
}

data class ChatMessageDto @QueryProjection constructor(
    val id: Long,
    val roomId: UUID,
    val memberId: Long,
    val content: String,
    val createdDatetime: OffsetDateTime,
    val editedDatetime: OffsetDateTime? = null,
) {
    fun toGraphQL(): ChatMessageQL {
        return ChatMessageQL(id, roomId.toString(), memberId, content, createdDatetime, editedDatetime)
    }
}

fun ChatMessage.toDto(): ChatMessageDto =
    ChatMessageDto(
        id = requireNotNull(id),
        roomId = roomId,
        memberId = memberId,
        content = content,
        createdDatetime = createdDatetime,
        editedDatetime = editedDatetime,
    )
