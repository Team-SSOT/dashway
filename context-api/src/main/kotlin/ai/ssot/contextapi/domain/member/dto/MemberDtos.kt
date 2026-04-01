package ai.ssot.contextapi.domain.member.dto

import ai.ssot.contextapi.domain.auth.dto.AuthorityDto
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.shared.page.PageInfo
import java.time.LocalDateTime
import ai.ssot.contextapi.generated.types.Member as MemberGraphql

data class RegisterMemberDto(
    val name: String,
    val email: String,
    val password: String,
    val isEnabled: Boolean,
    val teamId: Long? = null,
    val authorityIds: List<Int>? = null,
)

data class UpdateMemberDto(
    val id: Long,
    val name: String? = null,
    val email: String? = null,
    val authorities: List<AuthorityDto>? = null,
    val isEnabled: Boolean? = null,
)

data class MemberDto(
    val id: Long,
    val name: String,
    val email: String,
    val isEnabled: Boolean,
    val createdDatetime: LocalDateTime,
) {
    constructor(member: Member): this(
        id = member.id!!,
        name = member.name,
        email = member.email,
        isEnabled = member.isEnabled,
        createdDatetime = member.createdDatetime,
    )

    fun toGraphQL(): MemberGraphql {
        return MemberGraphql.newBuilder()
            .id(java.lang.Long.valueOf(id))
            .name(name)
            .email(email)
            .isEnabled(isEnabled)
            .createdDatetime(createdDatetime)
            .build()
    }
}

data class MemberPage(
    val members: List<MemberDto>,
    val pageInfo: PageInfo
)
