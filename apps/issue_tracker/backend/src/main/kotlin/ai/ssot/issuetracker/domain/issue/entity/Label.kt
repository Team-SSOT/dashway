package ai.ssot.issuetracker.domain.issue.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.OffsetDateTime

@Entity
@Table(schema = "issue_tracker", name = "labels")
class Label(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    var id: Long? = null,

    @Column(name = "project_id", nullable = false)
    var projectId: Long = 0,

    @Column(nullable = false, columnDefinition = "TEXT")
    var name: String = "",

    @Column(nullable = false, length = 32)
    var color: String = "",

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "updated_datetime", nullable = false)
    var updatedDatetime: OffsetDateTime = OffsetDateTime.now(),
)
