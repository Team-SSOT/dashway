package ai.ssot.chat.domain.chat.repository

import ai.ssot.chat.domain.chat.entity.ChatRoom
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface ChatRoomRepository : JpaRepository<ChatRoom, UUID> {
    fun findByParticipantKeyHashAndIsDeletedFalse(participantKeyHash: String): ChatRoom?

    fun existsByIdAndIsEnabledTrueAndIsDeletedFalse(id: UUID): Boolean
}
