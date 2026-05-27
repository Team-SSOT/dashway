package ai.ssot.chat.domain.chat.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(schema = "chat", name = "chat_message")
class ChatMessage(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    var id: Long? = null,

    @Column(name = "room_id", nullable = false)
    var roomId: UUID = UUID(0L, 0L),

    @Column(name = "member_id", nullable = false)
    var memberId: Long = 0,

    @Column(name = "client_message_id", nullable = false, columnDefinition = "TEXT")
    var clientMessageId: String = "",

    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String = "",

    @Column(name = "is_enabled", nullable = false)
    var isEnabled: Boolean = true,

    @Column(name = "is_deleted", nullable = false)
    var isDeleted: Boolean = false,

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "edited_datetime")
    var editedDatetime: OffsetDateTime? = null,

    @Column(name = "deleted_datetime")
    var deletedDatetime: OffsetDateTime? = null,
)
