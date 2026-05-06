package ai.ssot.chat.domain.chat.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.io.Serializable
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(schema = "chat", name = "chat_room_members")
class ChatRoomMember(
    @EmbeddedId
    var id: ChatRoomMemberId = ChatRoomMemberId(),

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var role: ChatRoomRole = ChatRoomRole.MEMBER,

    @Column(name = "joined_datetime", nullable = false)
    var joinedDatetime: OffsetDateTime = OffsetDateTime.now(),
)

@Embeddable
data class ChatRoomMemberId(
    @Column(name = "room_id", nullable = false)
    var roomId: UUID = UUID(0L, 0L),

    @Column(name = "member_id", nullable = false)
    var memberId: Long = 0,
) : Serializable
