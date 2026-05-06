package ai.ssot.chat.domain.chat.repository

import ai.ssot.chat.domain.chat.entity.ChatRoomMember
import ai.ssot.chat.domain.chat.entity.ChatRoomMemberId
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface ChatRoomMemberRepository : JpaRepository<ChatRoomMember, ChatRoomMemberId> {
    fun findAllByIdRoomId(roomId: UUID): List<ChatRoomMember>

    @Query("select member from ChatRoomMember member where member.id.roomId in :roomIds")
    fun findAllByRoomIds(@Param("roomIds") roomIds: Collection<UUID>): List<ChatRoomMember>
}
