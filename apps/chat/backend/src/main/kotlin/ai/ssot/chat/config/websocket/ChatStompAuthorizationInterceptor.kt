package ai.ssot.chat.config.websocket

import ai.ssot.chat.config.auth.ChatMemberPrincipal
import ai.ssot.chat.config.auth.ContextApiAuthClient
import ai.ssot.chat.config.auth.memberId
import ai.ssot.chat.domain.chat.exception.InvalidChatRoomRequestException
import ai.ssot.chat.domain.chat.service.ChatRoomService
import org.springframework.messaging.Message
import org.springframework.messaging.MessageChannel
import org.springframework.messaging.simp.stomp.StompCommand
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.messaging.support.ChannelInterceptor
import org.springframework.messaging.support.MessageHeaderAccessor
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException
import org.springframework.stereotype.Component
import java.util.*

@Component
class ChatStompAuthorizationInterceptor(
    private val authClient: ContextApiAuthClient,
    private val chatRoomService: ChatRoomService,
) : ChannelInterceptor {
    override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
        val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor::class.java)
            ?: return message

        when (accessor.command) {
            StompCommand.CONNECT -> authenticate(accessor)
            StompCommand.SUBSCRIBE -> authorizeSubscribe(accessor)
            else -> Unit
        }

        return message
    }

    private fun authenticate(accessor: StompHeaderAccessor) {
        val authorizationHeader = accessor.getFirstNativeHeader("Authorization")
            ?.takeIf { it.isNotBlank() }
            ?: throw AuthenticationCredentialsNotFoundException("Authentication is required.")

        accessor.user = ChatMemberPrincipal(authClient.validate(authorizationHeader))
    }

    private fun authorizeSubscribe(accessor: StompHeaderAccessor) {
        val roomId = extractRoomId(accessor.destination) ?: return
        val memberId = accessor.user?.memberId()
            ?: throw AuthenticationCredentialsNotFoundException("Authentication is required.")

        chatRoomService.validateActiveRoomMember(roomId = roomId, memberId = memberId)
    }

    private fun extractRoomId(destination: String?): UUID? {
        if (destination == null ||
            !destination.startsWith(CHAT_ROOM_TOPIC_PREFIX) ||
            !destination.endsWith(CHAT_ROOM_TOPIC_SUFFIX)
        ) {
            return null
        }

        val roomId = destination
            .removePrefix(CHAT_ROOM_TOPIC_PREFIX)
            .removeSuffix(CHAT_ROOM_TOPIC_SUFFIX)

        return try {
            UUID.fromString(roomId)
        } catch (exception: IllegalArgumentException) {
            throw InvalidChatRoomRequestException("Chat room id must be a UUID.")
        }
    }
}

private const val CHAT_ROOM_TOPIC_PREFIX = "/topic/chat/rooms/"
private const val CHAT_ROOM_TOPIC_SUFFIX = "/messages"
