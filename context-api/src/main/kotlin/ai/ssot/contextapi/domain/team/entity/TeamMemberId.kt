package ai.ssot.contextapi.domain.team.entity

import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import java.io.Serializable

@Embeddable
data class TeamMemberId(
    @Column(name = "team_id", nullable = false)
    var teamId: Long = 0,
    @Column(name = "member_id", nullable = false)
    var memberId: Long = 0,
) : Serializable
