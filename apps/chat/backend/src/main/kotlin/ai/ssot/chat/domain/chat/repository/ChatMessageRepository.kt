package ai.ssot.chat.domain.chat.repository

import ai.ssot.chat.domain.chat.dto.ChatMessageCursorDto
import ai.ssot.chat.domain.chat.entity.ChatMessage
import ai.ssot.chat.domain.chat.entity.QChatMessage.Companion.chatMessage
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.EntityManager
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.OffsetDateTime
import java.util.*

interface ChatMessageRepository :
    JpaRepository<ChatMessage, Long>,
    ChatMessageCommandRepository,
    QChatMessageRepository

data class ChatMessageInsertResult(
    val message: ChatMessage,
    val created: Boolean,
)

interface ChatMessageCommandRepository {
    fun insertIfAbsent(
        roomId: UUID,
        memberId: Long,
        clientMessageId: String,
        content: String,
        createdDatetime: OffsetDateTime,
    ): ChatMessageInsertResult
}

interface QChatMessageRepository {
    fun findMessages(
        roomId: UUID,
        cursor: ChatMessageCursorDto?,
        limit: Int,
    ): List<ChatMessage>
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
        val insertedId = insertMessage(
            roomId = roomId,
            memberId = memberId,
            clientMessageId = clientMessageId,
            content = content,
            createdDatetime = createdDatetime,
        )

        if (insertedId != null) {
            return ChatMessageInsertResult(
                message = findMessageById(insertedId),
                created = true,
            )
        }

        val existingId = findExistingMessageId(
            roomId = roomId,
            memberId = memberId,
            clientMessageId = clientMessageId,
        )
            ?: throw IllegalStateException("Idempotent chat message insert did not return an existing message.")

        return ChatMessageInsertResult(
            message = findMessageById(existingId),
            created = false,
        )
    }

    private fun insertMessage(
        roomId: UUID,
        memberId: Long,
        clientMessageId: String,
        content: String,
        createdDatetime: OffsetDateTime,
    ): Long? {
        val results = entityManager.createNativeQuery(
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

        return results.firstOrNull()?.toLongId()
    }

    private fun findExistingMessageId(
        roomId: UUID,
        memberId: Long,
        clientMessageId: String,
    ): Long? {
        val results = entityManager.createNativeQuery(
            """
            SELECT id
            FROM chat.chat_message
            WHERE room_id = :roomId
              AND member_id = :memberId
              AND client_message_id = :clientMessageId
            """.trimIndent(),
        )
            .setParameter("roomId", roomId)
            .setParameter("memberId", memberId)
            .setParameter("clientMessageId", clientMessageId)
            .resultList

        return results.firstOrNull()?.toLongId()
    }

    private fun findMessageById(id: Long): ChatMessage =
        entityManager.find(ChatMessage::class.java, id)
            ?: throw IllegalStateException("Chat message $id was not found after idempotent insert.")

    private fun Any.toLongId(): Long =
        when (this) {
            is Number -> toLong()
            else -> error("Expected chat message id to be numeric but was ${this::class.simpleName}.")
        }
}

@Repository
class QChatMessageRepositoryImpl(
    private val queryFactory: JPAQueryFactory,
) : QChatMessageRepository {
    override fun findMessages(
        roomId: UUID,
        cursor: ChatMessageCursorDto?,
        limit: Int,
    ): List<ChatMessage> {
        val predicates = mutableListOf<BooleanExpression>(
            chatMessage.roomId.eq(roomId),
        )

        if (cursor != null) {
            predicates += chatMessage.createdDatetime.lt(cursor.createdDatetime)
                .or(
                    chatMessage.createdDatetime.eq(cursor.createdDatetime)
                        .and(chatMessage.id.lt(cursor.messageId)),
                )
        }

        return queryFactory.selectFrom(chatMessage)
            .where(*predicates.toTypedArray())
            .orderBy(chatMessage.createdDatetime.desc(), chatMessage.id.desc())
            .limit(limit.toLong())
            .fetch()
    }
}
