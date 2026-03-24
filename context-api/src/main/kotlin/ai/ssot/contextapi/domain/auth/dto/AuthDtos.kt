package ai.ssot.contextapi.domain.auth.dto

import ai.ssot.contextapi.domain.member.dto.MemberView
import ai.ssot.contextapi.shared.graphql.MutationError
import java.time.LocalDateTime

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

data class AuthTokenPair(
    val accessToken: String,
    val refreshToken: String,
    val accessTokenExpiresAt: LocalDateTime,
    val refreshTokenExpiresAt: LocalDateTime,
)

data class LoginPayload(
    val member: MemberView? = null,
    val tokens: AuthTokenPair? = null,
    val errors: List<MutationError> = emptyList(),
)

data class RefreshTokenPayload(
    val member: MemberView? = null,
    val tokens: AuthTokenPair? = null,
    val errors: List<MutationError> = emptyList(),
)

data class LogoutPayload(
    val loggedOut: Boolean = false,
    val errors: List<MutationError> = emptyList(),
)
