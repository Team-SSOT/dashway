package ai.ssot.contextapi.domain.team.entity

import jakarta.persistence.EmbeddedId
import jakarta.persistence.Entity
import jakarta.persistence.Table

@Entity
@Table(name = "team_member")
class TeamMember(
    @EmbeddedId
    var id: TeamMemberId = TeamMemberId(),
)
