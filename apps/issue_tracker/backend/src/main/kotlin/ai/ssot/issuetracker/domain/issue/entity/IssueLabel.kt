package ai.ssot.issuetracker.domain.issue.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.io.Serializable
import java.time.OffsetDateTime

@Entity
@Table(schema = "issue_tracker", name = "issue_labels")
class IssueLabel(
    @EmbeddedId
    var id: IssueLabelId = IssueLabelId(),

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: OffsetDateTime = OffsetDateTime.now(),
)

@Embeddable
data class IssueLabelId(
    @Column(name = "issue_id", nullable = false)
    var issueId: Long = 0,

    @Column(name = "label_id", nullable = false)
    var labelId: Long = 0,
) : Serializable
