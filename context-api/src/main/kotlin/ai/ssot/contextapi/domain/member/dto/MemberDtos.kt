package ai.ssot.contextapi.domain.member.dto

import ai.ssot.contextapi.shared.graphql.MutationError
import java.time.LocalDateTime

data class RegisterMemberInput(
    val name: String,
    val email: String,
    val password: String,
    val admin: Boolean? = null,
    val enabled: Boolean? = null,
)

data class UpdateMemberInput(
    val id: Long,
    val name: String? = null,
    val email: String? = null,
    val admin: Boolean? = null,
    val enabled: Boolean? = null,
)

data class MemberView(
    val id: Long,
    val name: String,
    val email: String,
    val admin: Boolean,
    val enabled: Boolean,
    val createdAt: LocalDateTime,
)

data class MemberPage(
    val items: List<MemberView>,
    val page: Int,
    val size: Int,
    val totalElements: Int,
    val totalPages: Int,
)

data class RegisterMemberPayload(
    val member: MemberView? = null,
    val errors: List<MutationError> = emptyList(),
)

data class UpdateMemberPayload(
    val member: MemberView? = null,
    val errors: List<MutationError> = emptyList(),
)
