package ai.ssot.contextapi.domain.auth.dto

import ai.ssot.contextapi.domain.member.dto.MemberDto
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

data class AuthSessionDto(
    val member: MemberDto,
    val tokens: AuthTokenPair,
)
