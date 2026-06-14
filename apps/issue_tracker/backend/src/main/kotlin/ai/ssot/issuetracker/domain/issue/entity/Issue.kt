package ai.ssot.issuetracker.domain.issue.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime

@Entity
@Table(schema = "issue_tracker", name = "issues")
class Issue(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    var id: Long? = null,

    @Column(name = "project_id", nullable = false)
    var projectId: Long = 0,

    @Column(nullable = false, columnDefinition = "TEXT")
    var title: String = "",

    @Column(columnDefinition = "TEXT")
    var content: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var status: IssueStatus = IssueStatus.BACKLOG,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    var priority: IssuePriority = IssuePriority.NO_PRIORITY,

    @Column(name = "reporter_member_id", nullable = false)
    var reporterMemberId: Long = 0,

    @Column(name = "creator_member_id", nullable = false)
    var creatorMemberId: Long = 0,

    @Column(name = "due_datetime")
    var dueDatetime: OffsetDateTime? = null,

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
