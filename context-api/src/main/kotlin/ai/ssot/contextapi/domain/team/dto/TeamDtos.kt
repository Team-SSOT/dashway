package ai.ssot.contextapi.domain.team.dto

import ai.ssot.contextapi.shared.graphql.MutationError
import java.time.LocalDateTime

data class CreateTeamInput(
    val name: String,
)

data class UpdateTeamInput(
    val id: Long,
    val name: String,
)

data class DeleteTeamInput(
    val id: Long,
)

data class AddTeamMemberInput(
    val teamId: Long,
    val memberId: Long,
)

data class RemoveTeamMemberInput(
    val teamId: Long,
    val memberId: Long,
)

data class TeamView(
    val id: Long,
    val name: String,
    val createdAt: LocalDateTime,
)

data class TeamPage(
    val items: List<TeamView>,
    val page: Int,
    val size: Int,
    val totalElements: Int,
    val totalPages: Int,
)

data class TeamMemberView(
    val id: Long,
    val name: String,
    val email: String,
    val admin: Boolean,
    val enabled: Boolean,
    val createdAt: LocalDateTime,
)

data class MemberPage(
    val items: List<TeamMemberView>,
    val page: Int,
    val size: Int,
    val totalElements: Int,
    val totalPages: Int,
)

data class CreateTeamPayload(
    val team: TeamView? = null,
    val errors: List<MutationError> = emptyList(),
)

data class UpdateTeamPayload(
    val team: TeamView? = null,
    val errors: List<MutationError> = emptyList(),
)

data class DeleteTeamPayload(
    val deleted: Boolean = false,
    val errors: List<MutationError> = emptyList(),
)

data class AddTeamMemberPayload(
    val team: TeamView? = null,
    val member: TeamMemberView? = null,
    val errors: List<MutationError> = emptyList(),
)

data class RemoveTeamMemberPayload(
    val team: TeamView? = null,
    val member: TeamMemberView? = null,
    val errors: List<MutationError> = emptyList(),
)
