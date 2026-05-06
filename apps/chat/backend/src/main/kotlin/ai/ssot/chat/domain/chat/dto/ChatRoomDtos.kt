package ai.ssot.chat.domain.chat.dto

import ai.ssot.chat.domain.chat.entity.ChatRoomRole
import ai.ssot.chat.domain.chat.entity.ChatRoomType
import ai.ssot.chat.domain.chat.entity.ChatRoom
import ai.ssot.chat.domain.chat.entity.ChatRoomMember
import java.time.OffsetDateTime
import java.util.UUID

data class CreateChatRoomDto(
    val type: ChatRoomType,
    val isPublic: Boolean,
    val title: String?,
    val participantMemberIds: List<Long>,
)

data class ChatRoomDto(
    val id: UUID,
    val type: ChatRoomType,
    val isPublic: Boolean,
    val title: String?,
    val members: List<ChatRoomMemberDto>,
    val createdDatetime: OffsetDateTime,
    val updatedDatetime: OffsetDateTime,
)

data class ChatRoomMemberDto(
    val memberId: Long,
    val role: ChatRoomRole,
    val joinedDatetime: OffsetDateTime,
)

fun ChatRoom.toDto(members: List<ChatRoomMember>): ChatRoomDto =
    ChatRoomDto(
        id = requireNotNull(id),
        type = type,
        isPublic = isPublic,
        title = title,
        members = members.toDtos(),
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
