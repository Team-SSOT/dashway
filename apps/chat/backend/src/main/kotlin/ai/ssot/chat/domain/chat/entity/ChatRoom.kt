package ai.ssot.chat.domain.chat.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(schema = "chat", name = "chat_room")
class ChatRoom(
    @Id
    @Column(nullable = false)
    var id: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var type: ChatRoomType = ChatRoomType.GROUP,

    @Column(columnDefinition = "TEXT")
    var title: String? = null,

    @Column(name = "is_public", nullable = false)
    var isPublic: Boolean = false,

    @Column(name = "is_enabled", nullable = false)
    var isEnabled: Boolean = true,

    @Column(name = "is_deleted", nullable = false)
    var isDeleted: Boolean = false,

    @Column(name = "participant_key_hash", length = 64)
    var participantKeyHash: String? = null,

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "updated_datetime", nullable = false)
    var updatedDatetime: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "deleted_datetime")
    var deletedDatetime: OffsetDateTime? = null,
)
