package ai.ssot.chat.domain.chat.repository

import ai.ssot.chat.domain.chat.dto.ChatMessageCursorResult
import ai.ssot.chat.domain.chat.dto.QChatMessageDto
import ai.ssot.chat.domain.chat.entity.ChatMessage
import ai.ssot.chat.domain.chat.entity.QChatMessage.Companion.chatMessage
import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.EntityManager
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.OffsetDateTime
import java.util.*

interface ChatMessageRepository :
    JpaRepository<ChatMessage, Long>,
    QChatMessageRepository,
    ChatMessageCommandRepository

data class ChatMessageInsertResult(
    val message: ChatMessage,
    val created: Boolean,
)

interface QChatMessageRepository {
    fun findCursorResultByRoomId(roomId: UUID, size: Int, cursor: Long?): ChatMessageCursorResult
}

interface ChatMessageCommandRepository {
    fun insertIfAbsent(
        roomId: UUID,
        memberId: Long,
        clientMessageId: String,
        content: String,
        createdDatetime: OffsetDateTime,
    ): ChatMessageInsertResult
}

class QChatMessageRepositoryImpl(
    private val queryFactory: JPAQueryFactory,
) : QChatMessageRepository {

    override fun findCursorResultByRoomId(roomId: UUID, size: Int, cursor: Long?): ChatMessageCursorResult {
        val fetchedMessages = queryFactory.select(
            QChatMessageDto(
                chatMessage.id,
                chatMessage.roomId,
                chatMessage.memberId,
                chatMessage.clientMessageId,
                chatMessage.content,
                chatMessage.isDeleted,
                chatMessage.createdDatetime,
                chatMessage.editedDatetime,
                chatMessage.deletedDatetime,
            )
        ).from(chatMessage)
            .where(
                chatMessage.roomId.eq(roomId),
                chatMessage.isEnabled.isTrue,
                cursor?.let { chatMessage.id.lt(cursor) },
            )
            .orderBy(chatMessage.id.desc())
            .limit((size + 1).toLong())
            .fetch()
        val hasNext = fetchedMessages.size > size
        val returnedMessages = fetchedMessages.take(size)

        return ChatMessageCursorResult(
            messages = returnedMessages,
            hasNext = hasNext,
            nextCursor = if (hasNext) returnedMessages.lastOrNull()?.id else null,
        )
    }
}

@Repository
class ChatMessageCommandRepositoryImpl(
    private val entityManager: EntityManager,
) : ChatMessageCommandRepository {
    override fun insertIfAbsent(
        roomId: UUID,
        memberId: Long,
        clientMessageId: String,
        content: String,
        createdDatetime: OffsetDateTime,
    ): ChatMessageInsertResult {
        val insertedId = entityManager.createNativeQuery(
            """
            INSERT INTO chat.chat_message (
                room_id,
                member_id,
                client_message_id,
                content,
                created_datetime
            )
            VALUES (:roomId, :memberId, :clientMessageId, :content, :createdDatetime)
            ON CONFLICT (room_id, member_id, client_message_id) DO NOTHING
            RETURNING id
            """.trimIndent(),
        )
            .setParameter("roomId", roomId)
            .setParameter("memberId", memberId)
            .setParameter("clientMessageId", clientMessageId)
            .setParameter("content", content)
            .setParameter("createdDatetime", createdDatetime)
            .resultList
            .firstOrNull()
            ?.let { (it as Number).toLong() }

        if (insertedId != null) {
            return ChatMessageInsertResult(
                message = requireNotNull(entityManager.find(ChatMessage::class.java, insertedId)),
                created = true,
            )
        }

        val existingMessage = entityManager.createQuery(
            """
            SELECT message
            FROM ChatMessage message
            WHERE message.roomId = :roomId
              AND message.memberId = :memberId
              AND message.clientMessageId = :clientMessageId
            """.trimIndent(),
            ChatMessage::class.java,
        )
            .setParameter("roomId", roomId)
            .setParameter("memberId", memberId)
            .setParameter("clientMessageId", clientMessageId)
            .singleResult

        return ChatMessageInsertResult(
            message = existingMessage,
            created = false,
        )
    }
}
