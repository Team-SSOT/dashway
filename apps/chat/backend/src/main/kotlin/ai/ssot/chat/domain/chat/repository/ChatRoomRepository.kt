package ai.ssot.chat.domain.chat.repository

import ai.ssot.chat.domain.chat.dto.ChatRoomDto
import ai.ssot.chat.domain.chat.dto.QChatRoomDto
import ai.ssot.chat.domain.chat.entity.ChatRoom
import ai.ssot.chat.domain.chat.entity.QChatRoom.Companion.chatRoom
import ai.ssot.chat.domain.chat.entity.QChatRoomFavorite.Companion.chatRoomFavorite
import ai.ssot.chat.domain.chat.entity.QChatRoomMember.Companion.chatRoomMember
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

interface ChatRoomRepository : JpaRepository<ChatRoom, UUID>, QChatRoomRepository {
    fun findByParticipantKeyHashAndIsDeletedFalse(participantKeyHash: String): ChatRoom?

    fun findByIdAndIsEnabledTrueAndIsDeletedFalse(id: UUID): ChatRoom?

    fun existsByIdAndIsEnabledTrueAndIsDeletedFalse(id: UUID): Boolean
}

interface QChatRoomRepository {
    fun findJoinedChatRooms(memberId: Long, favoriteOnly: Boolean, pageable: Pageable, ): Page<ChatRoomDto>
}

@Repository
class QChatRoomRepositoryImpl(
    private val queryFactory: JPAQueryFactory,
) : QChatRoomRepository {

    override fun findJoinedChatRooms(memberId: Long, favoriteOnly: Boolean, pageable: Pageable,): Page<ChatRoomDto> {
        val predicates = joinedRoomPredicates(favoriteOnly)
        val totalCount = queryFactory.select(chatRoom.count())
            .from(chatRoom)
            .innerJoin(chatRoomMember).on(
                chatRoomMember.id.roomId.eq(chatRoom.id)
                    .and(chatRoomMember.id.memberId.eq(memberId)),
            )
            .leftJoin(chatRoomFavorite).on(
                chatRoomFavorite.id.roomId.eq(chatRoom.id)
                    .and(chatRoomFavorite.id.memberId.eq(memberId)),
            )
            .where(*predicates)
            .fetchOne() ?: 0L

        if (totalCount == 0L) {
            return PageImpl(emptyList(), pageable, totalCount)
        }

        val rooms = queryFactory.select(
            QChatRoomDto(
                chatRoom.id,
                chatRoom.type,
                chatRoom.isPublic,
                chatRoom.title,
                chatRoomFavorite.id.roomId.isNotNull,
                chatRoom.createdDatetime,
                chatRoom.updatedDatetime,
            ),
        )
            .from(chatRoom)
            .innerJoin(chatRoomMember).on(
                chatRoomMember.id.roomId.eq(chatRoom.id)
                    .and(chatRoomMember.id.memberId.eq(memberId)),
            )
            .leftJoin(chatRoomFavorite).on(
                chatRoomFavorite.id.roomId.eq(chatRoom.id)
                    .and(chatRoomFavorite.id.memberId.eq(memberId)),
            )
            .where(*predicates)
            .orderBy(chatRoom.updatedDatetime.desc(), chatRoom.id.desc())
            .offset(pageable.offset)
            .limit(pageable.pageSize.toLong())
            .fetch()

        return PageImpl(rooms, pageable, totalCount)
    }

    private fun joinedRoomPredicates(favoriteOnly: Boolean): Array<BooleanExpression> {
        val predicates = mutableListOf(
            chatRoom.isEnabled.isTrue,
            chatRoom.isDeleted.isFalse,
        )

        if (favoriteOnly) {
            predicates += chatRoomFavorite.id.roomId.isNotNull
        }

        return predicates.toTypedArray()
    }
}
