package ai.ssot.chat.domain.chat.service

import ai.ssot.chat.domain.chat.dto.ChatRoomMemberDto
import ai.ssot.chat.domain.chat.dto.toDtos
import ai.ssot.chat.domain.chat.entity.ChatRoomRole
import ai.ssot.chat.domain.chat.repository.ChatRoomMemberRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

@Service
class ChatRoomMemberService(
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
) {
    @Transactional(readOnly = true)
    fun getChatRoomMembers(roomIds: Set<UUID>): Map<UUID, List<ChatRoomMemberDto>> {
        if (roomIds.isEmpty()) {
            return emptyMap()
        }

        return chatRoomMemberRepository.findByRoomIds(roomIds)
            .groupBy { it.id.roomId }
            .mapValues { (_, members) -> members.toDtos() }
    }

    @Transactional(readOnly = true)
    fun getChatRoomCanDeleteByRoomIds(
        memberId: Long,
        roomIds: Set<UUID>,
    ): Map<UUID, Boolean> {
        if (roomIds.isEmpty()) {
            return emptyMap()
        }

        val rolesByRoomId = chatRoomMemberRepository.findRolesByMemberIdAndRoomIds(
            memberId = memberId,
            roomIds = roomIds,
        )

        return roomIds.associateWith { roomId ->
            rolesByRoomId[roomId] == ChatRoomRole.OWNER
        }
    }

    @Transactional(readOnly = true)
    fun getChatRoomMemberCounts(roomIds: Set<UUID>): Map<UUID, Int> {
        if (roomIds.isEmpty()) {
            return emptyMap()
        }

        val countsByRoomId = chatRoomMemberRepository.countByRoomIds(roomIds)

        return roomIds.associateWith { roomId ->
            countsByRoomId[roomId] ?: 0
        }
    }
}
