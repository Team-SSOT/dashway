package ai.ssot.chat.domain.chat.controller

import ai.ssot.chat.domain.chat.dto.ChatRoomDto
import ai.ssot.chat.domain.chat.dto.ChatRoomMemberDto
import ai.ssot.chat.domain.chat.dto.CreateChatRoomDto
import ai.ssot.chat.domain.chat.entity.ChatRoomRole
import ai.ssot.chat.domain.chat.entity.ChatRoomType
import ai.ssot.chat.generated.types.ChatRoom
import ai.ssot.chat.generated.types.ChatRoomMember
import ai.ssot.chat.generated.types.CreateChatRoomInput
import ai.ssot.chat.generated.types.ChatRoomRole as GraphQlChatRoomRole
import ai.ssot.chat.generated.types.ChatRoomType as GraphQlChatRoomType

fun CreateChatRoomInput.toDto(): CreateChatRoomDto =
    CreateChatRoomDto(
        type = ChatRoomType.valueOf(type.name),
        isPublic = isPublic,
        title = title,
        participantMemberIds = participantMemberIds.map { it.toLong() },
    )

fun ChatRoomDto.toGraphQL(currentMemberId: Long): ChatRoom =
    ChatRoom(
        id.toString(),
        GraphQlChatRoomType.valueOf(type.name),
        isPublic,
        title,
        members.any { it.memberId == currentMemberId },
        false,
        members.any { it.memberId == currentMemberId && it.role == ChatRoomRole.OWNER },
        members.size,
        emptyList(),
        createdDatetime,
        updatedDatetime,
    )

fun ChatRoomMemberDto.toGraphQL(): ChatRoomMember =
    ChatRoomMember(
        memberId,
        GraphQlChatRoomRole.valueOf(role.name),
        joinedDatetime,
    )
