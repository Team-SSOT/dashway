package ai.ssot.chat.domain.chat.dto

import ai.ssot.chat.domain.chat.entity.ChatRoom
import ai.ssot.chat.domain.chat.entity.ChatRoomMember
import ai.ssot.chat.domain.chat.entity.ChatRoomRole
import ai.ssot.chat.domain.chat.entity.ChatRoomType
import com.querydsl.core.annotations.QueryProjection
import java.time.OffsetDateTime
import java.util.*

data class CreateChatRoomDto(
    val type: ChatRoomType,
    val isPublic: Boolean,
    val title: String?,
    val participantMemberIds: List<Long>,
)

data class ChatRoomSearchDto(
    val page: Int,
    val size: Int,
    val favoriteOnly: Boolean,
)

data class ChatRoomSearchResult(
    val rooms: List<ChatRoomDto>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
)

data class DeleteChatRoomDto(
    val roomId: String,
)

data class SetChatRoomFavoriteDto(
    val roomId: String,
    val isFavorite: Boolean,
)

data class ChatRoomDto @QueryProjection constructor(
    val id: UUID,
    val type: ChatRoomType,
    val isPublic: Boolean,
    val title: String?,
    val isFavorite: Boolean,
    val createdDatetime: OffsetDateTime,
    val updatedDatetime: OffsetDateTime,
)

data class ChatRoomMemberDto(
    val memberId: Long,
    val role: ChatRoomRole,
    val joinedDatetime: OffsetDateTime,
)

fun ChatRoom.toDto(isFavorite: Boolean = false): ChatRoomDto =
    ChatRoomDto(
        id = requireNotNull(id),
        type = type,
        isPublic = isPublic,
        title = title,
        isFavorite = isFavorite,
        createdDatetime = createdDatetime,
        updatedDatetime = updatedDatetime,
    )

fun List<ChatRoomMember>.toDtos(): List<ChatRoomMemberDto> =
    sortedBy { it.id.memberId }
        .map { member ->
            ChatRoomMemberDto(
                memberId = member.id.memberId,
                role = member.role,
                joinedDatetime = member.joinedDatetime,
            )
        }
