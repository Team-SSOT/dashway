package ai.ssot.chat.domain.chat.service

import ai.ssot.chat.domain.chat.dto.ChatRoomDto
import ai.ssot.chat.domain.chat.dto.CreateChatRoomDto
import ai.ssot.chat.domain.chat.dto.ChatRoomMemberDto
import ai.ssot.chat.domain.chat.dto.toDto
import ai.ssot.chat.domain.chat.dto.toDtos
import ai.ssot.chat.domain.chat.entity.ChatRoom
import ai.ssot.chat.domain.chat.entity.ChatRoomMember
import ai.ssot.chat.domain.chat.entity.ChatRoomMemberId
import ai.ssot.chat.domain.chat.entity.ChatRoomRole
import ai.ssot.chat.domain.chat.entity.ChatRoomType
import ai.ssot.chat.domain.chat.exception.InvalidChatRoomRequestException
import ai.ssot.chat.domain.chat.repository.ChatRoomMemberRepository
import ai.ssot.chat.domain.chat.repository.ChatRoomRepository
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.nio.charset.StandardCharsets
import java.security.MessageDigest
import java.time.OffsetDateTime
import java.util.HexFormat
import java.util.UUID

@Service
class ChatRoomService(
    private val chatRoomRepository: ChatRoomRepository,
    private val chatRoomMemberRepository: ChatRoomMemberRepository,
) {
    @Transactional
    fun createChatRoom(
        memberId: Long,
        dto: CreateChatRoomDto,
    ): ChatRoomDto {
        val type = dto.type
        val participantMemberIds = dto.participantMemberIds
        validateParticipants(memberId, participantMemberIds)

        return when (type) {
            ChatRoomType.DIRECT -> createDirectChatRoom(
                creatorMemberId = memberId,
                participantMemberIds = participantMemberIds,
                isPublic = dto.isPublic,
            )
            ChatRoomType.GROUP -> createGroupChatRoom(
                creatorMemberId = memberId,
                participantMemberIds = participantMemberIds,
                isPublic = dto.isPublic,
                title = dto.title,
            )
        }
    }

    @Transactional(readOnly = true)
    fun getChatRoomMembers(roomIds: Set<UUID>): Map<UUID, List<ChatRoomMemberDto>> {
        if (roomIds.isEmpty()) {
            return emptyMap()
        }

        return chatRoomMemberRepository.findAllByRoomIds(roomIds)
            .groupBy { it.id.roomId }
            .mapValues { (_, members) -> members.toDtos() }
    }

    private fun validateParticipants(creatorMemberId: Long, participantMemberIds: List<Long>) {
        if (participantMemberIds.distinct().size != participantMemberIds.size) {
            throw InvalidChatRoomRequestException("participantMemberIds must not contain duplicates.")
        }
        if (creatorMemberId !in participantMemberIds) {
            throw InvalidChatRoomRequestException("Creator must be included in participantMemberIds.")
        }
    }

    private fun createDirectChatRoom(
        creatorMemberId: Long,
        participantMemberIds: List<Long>,
        isPublic: Boolean,
    ): ChatRoomDto {
        if (participantMemberIds.size != 2) {
            throw InvalidChatRoomRequestException("DIRECT chat rooms require exactly two participants.")
        }
        if (isPublic) {
            throw InvalidChatRoomRequestException("DIRECT chat rooms cannot be public.")
        }

        val participantKeyHash = createParticipantKeyHash(participantMemberIds)
        chatRoomRepository.findByParticipantKeyHashAndIsDeletedFalse(participantKeyHash)
            ?.let { return loadRoomDtoWithMembers(it) }

        return try {
            createRoomWithMembers(
                creatorMemberId = creatorMemberId,
                type = ChatRoomType.DIRECT,
                isPublic = false,
                title = null,
                participantKeyHash = participantKeyHash,
                participantMemberIds = participantMemberIds,
            )
        } catch (exception: DataIntegrityViolationException) {
            chatRoomRepository.findByParticipantKeyHashAndIsDeletedFalse(participantKeyHash)
                ?.let(::loadRoomDtoWithMembers)
                ?: throw exception
        }
    }

    private fun createGroupChatRoom(
        creatorMemberId: Long,
        participantMemberIds: List<Long>,
        isPublic: Boolean,
        title: String?,
    ): ChatRoomDto {
        if (participantMemberIds.size !in 2..100) {
            throw InvalidChatRoomRequestException("GROUP chat rooms require between 2 and 100 participants.")
        }

        return createRoomWithMembers(
            creatorMemberId = creatorMemberId,
            type = ChatRoomType.GROUP,
            isPublic = isPublic,
            title = title?.trim()?.takeIf { it.isNotEmpty() },
            participantKeyHash = null,
            participantMemberIds = participantMemberIds,
        )
    }

    private fun createRoomWithMembers(
        creatorMemberId: Long,
        type: ChatRoomType,
        isPublic: Boolean,
        title: String?,
        participantKeyHash: String?,
        participantMemberIds: List<Long>,
    ): ChatRoomDto {
        val now = OffsetDateTime.now()
        val room = chatRoomRepository.saveAndFlush(
            ChatRoom(
                id = UUID.randomUUID(),
                type = type,
                title = title,
                isPublic = isPublic,
                participantKeyHash = participantKeyHash,
                createdDatetime = now,
                updatedDatetime = now,
            ),
        )

        val members = participantMemberIds.map { memberId ->
            ChatRoomMember(
                id = ChatRoomMemberId(
                    roomId = requireNotNull(room.id),
                    memberId = memberId,
                ),
                role = if (memberId == creatorMemberId) ChatRoomRole.OWNER else ChatRoomRole.MEMBER,
                joinedDatetime = now,
            )
        }
        chatRoomMemberRepository.saveAllAndFlush(members)

        return room.toDto(members)
    }

    private fun loadRoomDtoWithMembers(room: ChatRoom): ChatRoomDto =
        room.toDto(chatRoomMemberRepository.findAllByIdRoomId(requireNotNull(room.id)))

    private fun createParticipantKeyHash(participantMemberIds: List<Long>): String {
        val key = participantMemberIds.sorted().joinToString(separator = ":")
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(key.toByteArray(StandardCharsets.UTF_8))
        return HexFormat.of().formatHex(digest)
    }
}
