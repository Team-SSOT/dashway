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
@Table(schema = "issue_tracker", name = "issue_files")
class IssueFile(
    @EmbeddedId
    var id: IssueFileId = IssueFileId(),

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: OffsetDateTime = OffsetDateTime.now(),
)

@Embeddable
data class IssueFileId(
    @Column(name = "issue_id", nullable = false)
    var issueId: Long = 0,

    @Column(name = "file_id", nullable = false)
    var fileId: UUID = UUID(0L, 0L),
) : Serializable
