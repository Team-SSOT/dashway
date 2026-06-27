package ai.ssot.issuetracker.domain.issue.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.io.Serializable
import java.time.OffsetDateTime
import java.util.UUID

@Entity
@Table(schema = "issue_tracker", name = "comment_files")
class CommentFile(
    @EmbeddedId
    var id: CommentFileId = CommentFileId(),

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: OffsetDateTime = OffsetDateTime.now(),
)

@Embeddable
data class CommentFileId(
    @Column(name = "comment_id", nullable = false)
    var commentId: Long = 0,

    @Column(name = "file_id", nullable = false)
    var fileId: UUID = UUID(0L, 0L),
) : Serializable
