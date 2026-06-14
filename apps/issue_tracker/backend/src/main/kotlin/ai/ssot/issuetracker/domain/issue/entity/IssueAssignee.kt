package ai.ssot.issuetracker.domain.issue.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.io.Serializable
import java.time.OffsetDateTime

@Entity
@Table(schema = "issue_tracker", name = "issue_assignees")
class IssueAssignee(
    @EmbeddedId
    var id: IssueAssigneeId = IssueAssigneeId(),

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: OffsetDateTime = OffsetDateTime.now(),
)

@Embeddable
data class IssueAssigneeId(
    @Column(name = "issue_id", nullable = false)
    var issueId: Long = 0,

    @Column(name = "member_id", nullable = false)
    var memberId: Long = 0,
) : Serializable
