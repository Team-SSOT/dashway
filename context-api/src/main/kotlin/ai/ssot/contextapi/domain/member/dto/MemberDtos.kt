package ai.ssot.contextapi.domain.member.dto

import ai.ssot.contextapi.domain.member.entity.Member
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
    val authorityIds: List<Int>? = null,
    val isEnabled: Boolean? = null,
)

data class MemberDto(
    val id: Long,
    val name: String,
    val email: String,
    val profileImgPath: String?,
    val isEnabled: Boolean,
    val createdDatetime: LocalDateTime,
) {
    constructor(member: Member): this(
        id = member.id!!,
        name = member.name,
        email = member.email,
        profileImgPath = member.profileImgPath,
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
            .apply {
                profileImgPath?.let { profileImgPath(it) }
            }
            .build()
    }
}
