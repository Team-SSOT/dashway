package ai.ssot.contextapi.domain.team.entity

import jakarta.persistence.Column
import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Table
import java.time.LocalDateTime

@Entity
@Table(name = "team_member")
class TeamMember(
    @EmbeddedId
    var id: TeamMemberId = TeamMemberId(),

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: LocalDateTime = LocalDateTime.now(),
)
