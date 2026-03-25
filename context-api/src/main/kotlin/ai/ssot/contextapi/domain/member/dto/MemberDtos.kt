package ai.ssot.contextapi.domain.member.dto

import ai.ssot.contextapi.shared.page.PageInfo
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

data class MemberDto(
    val id: Long,
    val name: String,
    val email: String,
    val admin: Boolean,
    val enabled: Boolean,
    val createdDatetime: LocalDateTime,
)

data class MemberPage(
    val members: List<MemberDto>,
    val pageInfo: PageInfo
)
