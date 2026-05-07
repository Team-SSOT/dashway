package ai.ssot.chat.domain.chat.repository

import ai.ssot.chat.domain.chat.entity.ChatRoomMember
import ai.ssot.chat.domain.chat.entity.ChatRoomMemberId
import ai.ssot.chat.domain.chat.entity.ChatRoomRole
import ai.ssot.chat.domain.chat.entity.QChatRoomMember.Companion.chatRoomMember
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

interface ChatRoomMemberRepository : JpaRepository<ChatRoomMember, ChatRoomMemberId>, QChatRoomMemberRepository {
    fun existsByIdRoomIdAndIdMemberId(roomId: UUID, memberId: Long): Boolean
}

interface QChatRoomMemberRepository {
    fun findByRoomIds(roomIds: Collection<UUID>): List<ChatRoomMember>

    fun findRolesByMemberIdAndRoomIds(
        memberId: Long,
        roomIds: Collection<UUID>,
    ): Map<UUID, ChatRoomRole>

    fun countByRoomIds(roomIds: Collection<UUID>): Map<UUID, Int>
}

@Repository
class QChatRoomMemberRepositoryImpl(
    private val queryFactory: JPAQueryFactory,
) : QChatRoomMemberRepository {
    override fun findByRoomIds(roomIds: Collection<UUID>): List<ChatRoomMember> {
        if (roomIds.isEmpty()) {
            return emptyList()
        }

        return queryFactory.selectFrom(chatRoomMember)
            .where(chatRoomMember.id.roomId.`in`(roomIds))
            .fetch()
    }

    override fun findRolesByMemberIdAndRoomIds(
        memberId: Long,
        roomIds: Collection<UUID>,
    ): Map<UUID, ChatRoomRole> {
        if (roomIds.isEmpty()) {
            return emptyMap()
        }

        return queryFactory.select(chatRoomMember.id.roomId, chatRoomMember.role)
            .from(chatRoomMember)
            .where(
                chatRoomMember.id.roomId.`in`(roomIds),
                chatRoomMember.id.memberId.eq(memberId),
            )
            .fetch()
            .associate { tuple ->
                requireNotNull(tuple.get(chatRoomMember.id.roomId)) to requireNotNull(tuple.get(chatRoomMember.role))
            }
    }

    override fun countByRoomIds(roomIds: Collection<UUID>): Map<UUID, Int> {
        if (roomIds.isEmpty()) {
            return emptyMap()
        }

        return queryFactory.select(chatRoomMember.id.roomId, chatRoomMember.count())
            .from(chatRoomMember)
            .where(chatRoomMember.id.roomId.`in`(roomIds))
            .groupBy(chatRoomMember.id.roomId)
            .fetch()
            .associate { tuple ->
                requireNotNull(tuple.get(chatRoomMember.id.roomId)) to ((tuple.get(chatRoomMember.count()) ?: 0L).toInt())
            }
    }
}
