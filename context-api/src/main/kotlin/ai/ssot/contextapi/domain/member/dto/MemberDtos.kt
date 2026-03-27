package ai.ssot.contextapi.domain.member.dto

import ai.ssot.contextapi.generated.types.Member
import ai.ssot.contextapi.shared.page.PageInfo
import java.time.LocalDateTime

data class RegisterMemberDto(
    val name: String,
    val email: String,
    val password: String,
    val teamId: Long,
    val isAdmin: Boolean? = null,
    val isEnabled: Boolean? = null,
)

data class UpdateMemberDto(
    val id: Long,
    val name: String? = null,
    val email: String? = null,
    val isAdmin: Boolean? = null,
    val isEnabled: Boolean? = null,
)

data class MemberDto(
    val id: Long,
    val name: String,
    val email: String,
    val isAdmin: Boolean,
    val isEnabled: Boolean,
    val createdDatetime: LocalDateTime,
) {
    fun toGraphQL(): Member {
        return Member.newBuilder()
            .id(java.lang.Long.valueOf(id))
            .name(name)
            .email(email)
            .isAdmin(isAdmin)
            .isEnabled(isEnabled)
            .createdDatetime(createdDatetime)
            .build()
    }
}

data class MemberPage(
    val members: List<MemberDto>,
    val pageInfo: PageInfo
)
