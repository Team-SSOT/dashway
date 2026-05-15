package ai.ssot.chat.domain.chat.controller

import ai.ssot.chat.config.auth.memberId
import ai.ssot.chat.domain.chat.dto.ChatMessageDto
import ai.ssot.chat.domain.chat.dto.CreateChatMessageDto
import ai.ssot.chat.domain.chat.service.ChatMessageService
import org.springframework.messaging.handler.annotation.DestinationVariable
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.messaging.simp.SimpMessagingTemplate
import org.springframework.stereotype.Controller
import java.security.Principal
import java.time.OffsetDateTime
import java.util.*

@Controller
class ChatMessageStompController(
    private val chatMessageService: ChatMessageService,
    private val messagingTemplate: SimpMessagingTemplate,
) {
    @MessageMapping("/chat/rooms/{roomId}/messages")
    fun sendChatMessage(
        @DestinationVariable roomId: UUID,
        @Payload command: SendChatMessageCommand,
        principal: Principal,
    ) {
        val result = chatMessageService.createChatMessage(
            memberId = principal.memberId(),
            roomId = roomId,
            dto = command.toDto(),
        )

        if (!result.created) {
            return
        }

        messagingTemplate.convertAndSend(
            chatRoomMessageDestination(roomId),
            result.message.toCreatedPayload(),
        )
    }
}

data class SendChatMessageCommand(
    val clientMessageId: String? = null,
    val content: String? = null,
)

data class ChatMessageCreatedPayload(
    val eventType: String,
    val message: ChatMessagePayload,
)

data class ChatMessagePayload(
    val id: String,
    val roomId: String,
    val senderMemberId: Long,
    val clientMessageId: String,
    val content: String?,
    val isDeleted: Boolean,
    val createdDatetime: OffsetDateTime,
    val editedDatetime: OffsetDateTime?,
    val deletedDatetime: OffsetDateTime?,
)

fun SendChatMessageCommand.toDto(): CreateChatMessageDto =
    CreateChatMessageDto(
        clientMessageId = clientMessageId.orEmpty(),
        content = content.orEmpty(),
    )

fun ChatMessageDto.toCreatedPayload(): ChatMessageCreatedPayload =
    ChatMessageCreatedPayload(
        eventType = MESSAGE_CREATED_EVENT_TYPE,
        message = ChatMessagePayload(
            id = id.toString(),
            roomId = roomId.toString(),
            senderMemberId = senderMemberId,
            clientMessageId = clientMessageId,
            content = content,
            isDeleted = isDeleted,
            createdDatetime = createdDatetime,
            editedDatetime = editedDatetime,
            deletedDatetime = deletedDatetime,
        ),
    )

private fun chatRoomMessageDestination(roomId: UUID): String =
    "$CHAT_ROOM_TOPIC_PREFIX$roomId$CHAT_ROOM_TOPIC_SUFFIX"

private const val CHAT_ROOM_TOPIC_PREFIX = "/topic/chat/rooms/"
private const val CHAT_ROOM_TOPIC_SUFFIX = "/messages"
private const val MESSAGE_CREATED_EVENT_TYPE = "MESSAGE_CREATED"
