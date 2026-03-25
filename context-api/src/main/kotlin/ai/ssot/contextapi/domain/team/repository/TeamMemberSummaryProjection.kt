package ai.ssot.contextapi.domain.team.repository

import java.time.LocalDateTime

interface TeamMemberSummaryProjection {
    val id: Long
    val name: String
    val email: String
    val admin: Boolean
    val enabled: Boolean
    val createdDatetime: LocalDateTime
}
