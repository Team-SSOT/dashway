package ai.ssot.issuetracker.domain.project.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime

@Entity
@Table(schema = "issue_tracker", name = "projects")
class Project(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    var id: Long? = null,

    @Column(nullable = false, length = 32)
    var key: String = "",

    @Column(nullable = false, columnDefinition = "TEXT")
    var name: String = "",

    @Column(columnDefinition = "TEXT")
    var description: String? = null,

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
