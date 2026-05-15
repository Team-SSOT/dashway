package ai.ssot.chat.domain.chat.dto

import ai.ssot.chat.domain.chat.entity.ChatMessage
import java.time.OffsetDateTime
import java.util.*

data class CreateChatMessageDto(
    val clientMessageId: String,
    val content: String,
)

data class ChatMessageSearchDto(
    val roomId: String,
    val cursor: ChatMessageCursorInputDto?,
    val size: Int,
)

data class ChatMessageCursorInputDto(
    val createdDatetime: OffsetDateTime,
    val messageId: String,
)

data class ChatMessageDto(
    val id: Long,
    val roomId: UUID,
    val senderMemberId: Long,
    val clientMessageId: String,
    val content: String?,
    val isDeleted: Boolean,
    val createdDatetime: OffsetDateTime,
    val editedDatetime: OffsetDateTime?,
    val deletedDatetime: OffsetDateTime?,
)

data class ChatMessageCursorDto(
    val createdDatetime: OffsetDateTime,
    val messageId: Long,
)

data class ChatMessageSearchResult(
    val messages: List<ChatMessageDto>,
    val hasNext: Boolean,
    val nextCursor: ChatMessageCursorDto?,
)

fun ChatMessage.toDto(): ChatMessageDto =
    ChatMessageDto(
        id = requireNotNull(id),
        roomId = roomId,
        senderMemberId = memberId,
        clientMessageId = clientMessageId,
        content = content.takeUnless { isDeleted },
        isDeleted = isDeleted,
        createdDatetime = createdDatetime,
        editedDatetime = editedDatetime,
        deletedDatetime = deletedDatetime,
    )
