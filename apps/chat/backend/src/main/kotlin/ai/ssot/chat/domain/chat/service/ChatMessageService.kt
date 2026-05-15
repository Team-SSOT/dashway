package ai.ssot.chat.domain.chat.service

import ai.ssot.chat.domain.chat.dto.ChatMessageCursorDto
import ai.ssot.chat.domain.chat.dto.ChatMessageDto
import ai.ssot.chat.domain.chat.dto.ChatMessageSearchDto
import ai.ssot.chat.domain.chat.dto.ChatMessageSearchResult
import ai.ssot.chat.domain.chat.dto.CreateChatMessageDto
import ai.ssot.chat.domain.chat.dto.toDto
import ai.ssot.chat.domain.chat.exception.InvalidChatRoomRequestException
import ai.ssot.chat.domain.chat.repository.ChatMessageRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.*

@Service
class ChatMessageService(
    private val chatRoomService: ChatRoomService,
    private val chatMessageRepository: ChatMessageRepository,
) {
    @Transactional(readOnly = true)
    fun getChatMessages(
        memberId: Long,
        dto: ChatMessageSearchDto,
    ): ChatMessageSearchResult {
        val roomId = parseRoomId(dto.roomId)
        val cursor = dto.cursor?.let {
            ChatMessageCursorDto(
                createdDatetime = it.createdDatetime,
                messageId = parseMessageId(it.messageId),
            )
        }
        validateSearchSize(dto.size)
        chatRoomService.validateActiveRoomMember(roomId = roomId, memberId = memberId)

        val messages = chatMessageRepository.findMessages(
            roomId = roomId,
            cursor = cursor,
            limit = dto.size + 1,
        )
        val hasNext = messages.size > dto.size
        val returnedMessages = messages.take(dto.size).map { it.toDto() }

        return ChatMessageSearchResult(
            messages = returnedMessages,
            hasNext = hasNext,
            nextCursor = if (hasNext) returnedMessages.lastOrNull()?.toCursor() else null,
        )
    }

    @Transactional
    fun createChatMessage(
        memberId: Long,
        roomId: UUID,
        dto: CreateChatMessageDto,
    ): ChatMessageCreateResult {
        val clientMessageId = dto.clientMessageId.trim()
        val content = dto.content.trim()
        validateClientMessageId(clientMessageId)
        validateContent(content)
        chatRoomService.validateActiveRoomMember(roomId = roomId, memberId = memberId)

        val result = chatMessageRepository.insertIfAbsent(
            roomId = roomId,
            memberId = memberId,
            clientMessageId = clientMessageId,
            content = content,
            createdDatetime = OffsetDateTime.now(),
        )

        return ChatMessageCreateResult(
            message = result.message.toDto(),
            created = result.created,
        )
    }

    private fun validateClientMessageId(clientMessageId: String) {
        if (clientMessageId.isBlank()) {
            throw InvalidChatRoomRequestException("clientMessageId is required.")
        }

        if (clientMessageId.length > MAX_CLIENT_MESSAGE_ID_LENGTH) {
            throw InvalidChatRoomRequestException("clientMessageId must be 128 characters or less.")
        }
    }

    private fun validateContent(content: String) {
        if (content.isBlank()) {
            throw InvalidChatRoomRequestException("content is required.")
        }

        if (content.length > MAX_MESSAGE_CONTENT_LENGTH) {
            throw InvalidChatRoomRequestException("content must be 4000 characters or less.")
        }
    }

    private fun parseRoomId(roomId: String): UUID =
        try {
            UUID.fromString(roomId)
        } catch (_: IllegalArgumentException) {
            throw InvalidChatRoomRequestException("Chat room id must be a UUID.")
        }

    private fun parseMessageId(messageId: String): Long =
        messageId.toLongOrNull()
            ?: throw InvalidChatRoomRequestException("Chat message cursor id must be a number.")

    private fun validateSearchSize(size: Int) {
        if (size !in 1..MAX_CHAT_MESSAGE_SEARCH_SIZE) {
            throw InvalidChatRoomRequestException("size must be between 1 and 100.")
        }
    }

    private fun ChatMessageDto.toCursor(): ChatMessageCursorDto =
        ChatMessageCursorDto(
            createdDatetime = createdDatetime,
            messageId = id,
        )
}

data class ChatMessageCreateResult(
    val message: ChatMessageDto,
    val created: Boolean,
)

private const val MAX_CLIENT_MESSAGE_ID_LENGTH = 128
private const val MAX_MESSAGE_CONTENT_LENGTH = 4000
private const val MAX_CHAT_MESSAGE_SEARCH_SIZE = 100
