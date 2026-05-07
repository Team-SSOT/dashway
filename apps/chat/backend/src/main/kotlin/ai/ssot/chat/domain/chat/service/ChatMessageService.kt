package ai.ssot.chat.domain.chat.service

import ai.ssot.chat.domain.chat.dto.ChatMessageCursorResult
import ai.ssot.chat.domain.chat.dto.ChatMessageDto
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
    fun createChatMessage(memberId: Long, roomId: UUID, content: String, ): ChatMessageDto {
        if (content.isBlank()) {
            throw InvalidChatRoomRequestException("content is required.")
        }

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

    fun findCursorResult(roomId: UUID, size: Int, cursor: Long? = null): ChatMessageCursorResult {
        return chatMessageRepository.findCursorResultByRoomId(roomId, size, cursor)
    }
}

