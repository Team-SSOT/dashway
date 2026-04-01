package ai.ssot.contextapi.domain.auth.dto

import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.generated.types.AuthToken
import ai.ssot.contextapi.generated.types.Authority
import ai.ssot.contextapi.generated.types.LoginPayload

data class LoginInput(
    val email: String,
    val password: String,
)

data class RefreshTokenInput(
    val refreshToken: String,
)

data class LogoutInput(
    val refreshToken: String,
)

data class AuthTokenDto(
    val accessToken: String,
    val refreshToken: String,
) {
    fun toGraphQL() = AuthToken(accessToken)
}

data class AuthDto(
    val member: MemberDto,
    val tokens: AuthTokenDto,
) {
    fun toGraphQL() = LoginPayload.newBuilder()
        .member(member.toGraphQL())
        .tokens(tokens.toGraphQL())
        .build()
}

data class AuthorityDto (
    val id: Int,
    val name: String
) {
    fun toGraphQL() = Authority(id, name)
}
