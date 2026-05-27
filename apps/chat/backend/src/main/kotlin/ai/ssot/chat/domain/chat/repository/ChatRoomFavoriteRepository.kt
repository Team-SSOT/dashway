package ai.ssot.chat.domain.chat.repository

import ai.ssot.chat.domain.chat.entity.ChatRoomFavorite
import ai.ssot.chat.domain.chat.entity.ChatRoomFavoriteId
import jakarta.persistence.EntityManager
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.OffsetDateTime
import java.util.*

interface ChatRoomFavoriteRepository :
    JpaRepository<ChatRoomFavorite, ChatRoomFavoriteId>,
    ChatRoomFavoriteCommandRepository

interface ChatRoomFavoriteCommandRepository {
    fun insertIfAbsent(
        roomId: UUID,
        memberId: Long,
        createdDatetime: OffsetDateTime,
    )

    fun deleteByRoomIdAndMemberId(
        roomId: UUID,
        memberId: Long,
    )
}

@Repository
class ChatRoomFavoriteCommandRepositoryImpl(
    private val entityManager: EntityManager,
) : ChatRoomFavoriteCommandRepository {
    override fun insertIfAbsent(
        roomId: UUID,
        memberId: Long,
        createdDatetime: OffsetDateTime,
    ) {
        entityManager.createNativeQuery(
            """
            INSERT INTO chat.chat_room_favorites (
                room_id,
                member_id,
                created_datetime
            )
            VALUES (:roomId, :memberId, :createdDatetime)
            ON CONFLICT (room_id, member_id) DO NOTHING
            """.trimIndent(),
        )
            .setParameter("roomId", roomId)
            .setParameter("memberId", memberId)
            .setParameter("createdDatetime", createdDatetime)
            .executeUpdate()
    }

    override fun deleteByRoomIdAndMemberId(
        roomId: UUID,
        memberId: Long,
    ) {
        entityManager.createNativeQuery(
            """
            DELETE FROM chat.chat_room_favorites
            WHERE room_id = :roomId
              AND member_id = :memberId
            """.trimIndent(),
        )
            .setParameter("roomId", roomId)
            .setParameter("memberId", memberId)
            .executeUpdate()
    }
}
