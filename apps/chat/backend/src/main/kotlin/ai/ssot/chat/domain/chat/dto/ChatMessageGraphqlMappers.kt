package ai.ssot.chat.domain.chat.dto

import ai.ssot.chat.generated.types.ChatMessage as GraphQlChatMessage
import ai.ssot.chat.generated.types.ChatMessageCursor as GraphQlChatMessageCursor
import ai.ssot.chat.generated.types.ChatMessagesInput as GraphQlChatMessagesInput

fun GraphQlChatMessagesInput.toDto(): ChatMessageSearchDto =
    ChatMessageSearchDto(
        roomId = roomId,
        size = size,
        cursor = cursor,
    )

fun ChatMessageDto.toGraphQL(): GraphQlChatMessage =
    GraphQlChatMessage(
        id,
        roomId.toString(),
        memberId,
        if (isDeleted) null else content,
        isDeleted,
        createdDatetime,
        editedDatetime,
        deletedDatetime,
    )

fun ChatMessageCursorResult.toGraphQL(): GraphQlChatMessageCursor =
    GraphQlChatMessageCursor(
        messages.map { it.toGraphQL() },
        hasNext,
        nextCursor,
    )
