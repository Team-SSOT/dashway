package ai.ssot.chat.domain.chat.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.io.Serializable
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(schema = "chat", name = "chat_room_favorites")
class ChatRoomFavorite(
    @EmbeddedId
    var id: ChatRoomFavoriteId = ChatRoomFavoriteId(),

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: OffsetDateTime = OffsetDateTime.now(),
)

@Embeddable
data class ChatRoomFavoriteId(
    @Column(name = "room_id", nullable = false)
    var roomId: UUID = UUID(0L, 0L),

    @Column(name = "member_id", nullable = false)
    var memberId: Long = 0,
) : Serializable
