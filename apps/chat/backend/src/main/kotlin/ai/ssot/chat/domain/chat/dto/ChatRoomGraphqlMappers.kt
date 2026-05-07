package ai.ssot.chat.domain.chat.dto

import ai.ssot.chat.domain.chat.entity.ChatRoomType
import ai.ssot.chat.generated.types.ChatRoomsInput
import ai.ssot.chat.generated.types.CreateChatRoomInput
import ai.ssot.chat.generated.types.ChatRoom as GraphQlChatRoom
import ai.ssot.chat.generated.types.ChatRoomMember as GraphQlChatRoomMember
import ai.ssot.chat.generated.types.ChatRoomPage as GraphQlChatRoomPage
import ai.ssot.chat.generated.types.ChatRoomRole as GraphQlChatRoomRole
import ai.ssot.chat.generated.types.ChatRoomType as GraphQlChatRoomType
import ai.ssot.chat.generated.types.PageInfo as GraphQlPageInfo

fun CreateChatRoomInput.toDto(): CreateChatRoomDto =
    CreateChatRoomDto(
        type = ChatRoomType.valueOf(type.name),
        isPublic = isPublic,
        title = title,
        participantMemberIds = participantMemberIds.map { it.toLong() },
    )

fun ChatRoomsInput.toDto(): ChatRoomSearchDto =
    ChatRoomSearchDto(
        page = page,
        size = size,
        favoriteOnly = favoriteOnly ?: false,
    )

fun ChatRoomSearchResult.toGraphQL(): GraphQlChatRoomPage =
    GraphQlChatRoomPage(
        rooms.map { it.toGraphQL() },
        GraphQlPageInfo(page, size, Math.toIntExact(totalElements), totalPages),
    )

fun ChatRoomDto.toGraphQL(): GraphQlChatRoom =
    GraphQlChatRoom(
        id.toString(),
        GraphQlChatRoomType.valueOf(type.name),
        isPublic,
        title,
        isFavorite,
        false,
        0,
        emptyList(),
        createdDatetime,
        updatedDatetime,
    )

fun ChatRoomMemberDto.toGraphQL(): GraphQlChatRoomMember =
    GraphQlChatRoomMember(
        memberId,
        GraphQlChatRoomRole.valueOf(role.name),
        joinedDatetime,
    )
