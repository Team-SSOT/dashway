package ai.ssot.chat.domain.chat.dto

import ai.ssot.chat.domain.chat.entity.ChatMessage
import com.querydsl.core.annotations.QueryProjection
import java.time.OffsetDateTime
import java.util.*

data class CreateChatMessageDto(
    val clientMessageId: String,
    val content: String,
)

data class ChatMessageSearchDto(
    val roomId: String,
    val size: Int,
    val cursor: Long?,
)

data class ChatMessageCursorResult(
    val messages: List<ChatMessageDto>,
    val hasNext: Boolean,
    val nextCursor: Long?,
)

data class ChatMessageCreateResult(
    val message: ChatMessageDto,
    val created: Boolean,
)

data class ChatMessageDto @QueryProjection constructor(
    val id: Long,
    val roomId: UUID,
    val memberId: Long,
    val clientMessageId: String,
    val content: String?,
    val isDeleted: Boolean,
    val createdDatetime: OffsetDateTime,
    val editedDatetime: OffsetDateTime? = null,
    val deletedDatetime: OffsetDateTime? = null,
)

fun ChatMessage.toDto(): ChatMessageDto =
    ChatMessageDto(
        id = requireNotNull(id),
        roomId = roomId,
        memberId = memberId,
        clientMessageId = clientMessageId,
        content = content,
        isDeleted = isDeleted,
        createdDatetime = createdDatetime,
        editedDatetime = editedDatetime,
        deletedDatetime = deletedDatetime,
    )
