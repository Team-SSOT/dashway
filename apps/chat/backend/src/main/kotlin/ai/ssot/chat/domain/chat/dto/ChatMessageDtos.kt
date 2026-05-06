package ai.ssot.chat.domain.chat.dto

import ai.ssot.chat.domain.chat.entity.ChatMessage
import java.time.OffsetDateTime
import java.util.*

data class CreateChatMessageDto(
    val content: String,
)

data class ChatMessageDto(
    val id: Long,
    val roomId: UUID,
    val senderMemberId: Long,
    val content: String,
    val createdDatetime: OffsetDateTime,
)

fun ChatMessage.toDto(): ChatMessageDto =
    ChatMessageDto(
        id = requireNotNull(id),
        roomId = roomId,
        senderMemberId = memberId,
        content = content,
        createdDatetime = createdDatetime,
    )
