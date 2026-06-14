package ai.ssot.issuetracker.domain.project.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Table
import java.io.Serializable
import java.time.OffsetDateTime

@Entity
@Table(schema = "issue_tracker", name = "project_members")
class ProjectMember(
    @EmbeddedId
    var id: ProjectMemberId = ProjectMemberId(),

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    var role: ProjectRole = ProjectRole.MEMBER,

    @Column(name = "joined_datetime", nullable = false)
    var joinedDatetime: OffsetDateTime = OffsetDateTime.now(),
)

@Embeddable
data class ProjectMemberId(
    @Column(name = "project_id", nullable = false)
    var projectId: Long = 0,

    @Column(name = "member_id", nullable = false)
    var memberId: Long = 0,
) : Serializable
