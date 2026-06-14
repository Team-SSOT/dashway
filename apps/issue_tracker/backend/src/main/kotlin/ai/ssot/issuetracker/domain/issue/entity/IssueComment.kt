package ai.ssot.issuetracker.domain.issue.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime

@Entity
@Table(schema = "issue_tracker", name = "issue_comments")
class IssueComment(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    var id: Long? = null,

    @Column(name = "issue_id", nullable = false)
    var issueId: Long = 0,

    @Column(name = "author_member_id", nullable = false)
    var authorMemberId: Long = 0,

    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String = "",

    @Column(name = "is_enabled", nullable = false)
    var isEnabled: Boolean = true,

    @Column(name = "is_deleted", nullable = false)
    var isDeleted: Boolean = false,

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "updated_datetime", nullable = false)
    var updatedDatetime: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "deleted_datetime")
    var deletedDatetime: OffsetDateTime? = null,
)
