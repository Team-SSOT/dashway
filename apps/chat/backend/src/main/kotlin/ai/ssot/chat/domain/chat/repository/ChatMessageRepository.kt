package ai.ssot.chat.domain.chat.repository

import ai.ssot.chat.domain.chat.dto.ChatMessageCursorResult
import ai.ssot.chat.domain.chat.dto.QChatMessageDto
import ai.ssot.chat.domain.chat.entity.ChatMessage
import ai.ssot.chat.domain.chat.entity.QChatMessage.Companion.chatMessage
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface ChatMessageRepository : JpaRepository<ChatMessage, Long>, QChatMessageRepository


interface QChatMessageRepository {
    fun findCursorResultByRoomId(roomId: UUID, size: Int, cursor: Long?): ChatMessageCursorResult
}


class QChatMessageRepositoryImpl(
    private val queryFactory: JPAQueryFactory,
) : QChatMessageRepository {

    override fun findCursorResultByRoomId(roomId: UUID, size: Int, cursor: Long?): ChatMessageCursorResult {
        return queryFactory.select(
            QChatMessageDto(
                chatMessage.id,
                chatMessage.roomId,
                chatMessage.memberId,
                chatMessage.content,
                chatMessage.createdDatetime,
                chatMessage.editedDatetime
            )
        ).from(chatMessage)
            .where(
                chatMessage.roomId.eq(roomId),
                chatMessage.isEnabled.isTrue,
                chatMessage.isDeleted.isFalse,
                cursor?.let{chatMessage.id.lt(cursor)},
            ).limit(size.toLong())
            .fetch()
            .let {
                val lastId = it.lastOrNull()?.id
                ChatMessageCursorResult(
                    messages = it,
                    hasNext = hasNext(roomId, lastId ?: 0),
                    nextCursor = lastId,
                )
            }
    }

    private fun hasNext(roomId: UUID, id: Long?): Boolean {
        return queryFactory.select(chatMessage.id)
            .from(chatMessage)
            .where(
                chatMessage.roomId.eq(roomId),
                chatMessage.isEnabled.isTrue,
                chatMessage.isDeleted.isFalse,
                id?.let { chatMessage.id.lt(id) },
            ).limit(1)
            .fetchOne() != null
    }
}
