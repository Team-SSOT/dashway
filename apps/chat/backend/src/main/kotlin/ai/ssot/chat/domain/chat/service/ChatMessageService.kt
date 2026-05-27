package ai.ssot.chat.domain.chat.service

import ai.ssot.chat.domain.chat.dto.ChatMessageCursorDto
import ai.ssot.chat.domain.chat.dto.ChatMessageCursorResult
import ai.ssot.chat.domain.chat.dto.ChatMessageCursorResult
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

    fun findCursorResult(roomId: UUID, size: Int, cursor: Long? = null): ChatMessageCursorResult {
        return chatMessageRepository.findCursorResultByRoomId(roomId, size, cursor)
    }
}

private const val MAX_MESSAGE_CONTENT_LENGTH = 4000
