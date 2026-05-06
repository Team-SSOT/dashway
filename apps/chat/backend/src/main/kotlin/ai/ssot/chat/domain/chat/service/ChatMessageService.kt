package ai.ssot.chat.domain.chat.service

import ai.ssot.chat.domain.chat.dto.ChatMessageDto
import ai.ssot.chat.domain.chat.dto.CreateChatMessageDto
import ai.ssot.chat.domain.chat.dto.toDto
import ai.ssot.chat.domain.chat.entity.ChatMessage
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
    @Transactional
    fun createChatMessage(
        memberId: Long,
        roomId: UUID,
        dto: CreateChatMessageDto,
    ): ChatMessageDto {
        val content = dto.content.trim()
        validateContent(content)
        chatRoomService.validateActiveRoomMember(roomId = roomId, memberId = memberId)

        return chatMessageRepository.saveAndFlush(
            ChatMessage(
                roomId = roomId,
                memberId = memberId,
                content = content,
                createdDatetime = OffsetDateTime.now(),
            ),
        ).toDto()
    }

    private fun validateContent(content: String) {
        if (content.isBlank()) {
            throw InvalidChatRoomRequestException("content is required.")
        }

        if (content.length > MAX_MESSAGE_CONTENT_LENGTH) {
            throw InvalidChatRoomRequestException("content must be 4000 characters or less.")
        }
    }
}

private const val MAX_MESSAGE_CONTENT_LENGTH = 4000
