package ai.ssot.chat.domain.chat.dto

import ai.ssot.chat.generated.types.ChatMessageCursor as GraphQlChatMessageCursor
import ai.ssot.chat.generated.types.ChatMessageSlice as GraphQlChatMessageSlice
import ai.ssot.chat.generated.types.ChatMessagesInput as GraphQlChatMessagesInput
import ai.ssot.chat.generated.types.ChatMessage as GraphQlChatMessage

fun GraphQlChatMessagesInput.toDto(): ChatMessageSearchDto =
    ChatMessageSearchDto(
        roomId = roomId,
        cursor = cursor?.let {
            ChatMessageCursorInputDto(
                createdDatetime = it.createdDatetime,
                messageId = it.messageId,
            )
        },
        size = size,
    )

fun ChatMessageDto.toGraphQL(): GraphQlChatMessage =
    GraphQlChatMessage(
        id.toString(),
        roomId.toString(),
        senderMemberId,
        clientMessageId,
        content,
        isDeleted,
        createdDatetime,
        editedDatetime,
        deletedDatetime,
    )

fun ChatMessageSearchResult.toGraphQL(): GraphQlChatMessageSlice =
    GraphQlChatMessageSlice(
        messages.map { it.toGraphQL() },
        hasNext,
        nextCursor?.toGraphQL(),
    )

fun ChatMessageCursorDto.toGraphQL(): GraphQlChatMessageCursor =
    GraphQlChatMessageCursor(
        createdDatetime,
        messageId.toString(),
    )
