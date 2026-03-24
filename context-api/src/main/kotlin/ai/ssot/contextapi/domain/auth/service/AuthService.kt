package ai.ssot.contextapi.domain.auth.service

import ai.ssot.contextapi.domain.auth.dto.AuthTokenPair
import ai.ssot.contextapi.domain.auth.dto.LoginInput
import ai.ssot.contextapi.domain.auth.dto.LoginPayload
import ai.ssot.contextapi.domain.auth.dto.LogoutInput
import ai.ssot.contextapi.domain.auth.dto.LogoutPayload
import ai.ssot.contextapi.domain.auth.dto.RefreshTokenInput
import ai.ssot.contextapi.domain.auth.dto.RefreshTokenPayload
import ai.ssot.contextapi.domain.auth.exception.InvalidCredentialsException
import ai.ssot.contextapi.domain.auth.exception.InvalidRefreshTokenException
import ai.ssot.contextapi.domain.auth.repository.RefreshTokenRepository
import ai.ssot.contextapi.domain.member.dto.MemberView
import ai.ssot.contextapi.domain.member.service.MemberAuthLookup
import ai.ssot.contextapi.domain.member.service.MemberAuthLookupService
import ai.ssot.contextapi.security.AuthProperties
import ai.ssot.contextapi.security.token.AccessTokenService
import ai.ssot.contextapi.shared.validation.requireNonBlankText
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneOffset

@Service
class AuthService(
    private val authProperties: AuthProperties,
    private val currentViewerService: CurrentViewerService,
    private val memberAuthLookupService: MemberAuthLookupService,
    private val passwordEncoder: PasswordEncoder,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val accessTokenService: AccessTokenService,
) {
    @Transactional(readOnly = true)
    fun me(): MemberView? =
        memberAuthLookupService.findById(currentViewerService.requireAuthenticated().memberId)?.toView()

    @Transactional(readOnly = true)
    fun login(input: LoginInput): LoginPayload {
        val email = input.email.trim()
        requireNonBlankText("email", email)
        requireNonBlankText("password", input.password)

        val member = memberAuthLookupService.findByEmail(email)
            ?.takeIf { it.enabled }
            ?.takeIf { !it.passwordHash.isNullOrBlank() }
            ?.takeIf { passwordEncoder.matches(input.password, it.passwordHash) }
            ?: throw InvalidCredentialsException()

        return LoginPayload(
            member = member.toView(),
            tokens = issueTokenPair(member),
        )
    }

    @Transactional
    fun refreshToken(input: RefreshTokenInput): RefreshTokenPayload {
        val refreshToken = input.refreshToken.trim()
        requireNonBlankText("refreshToken", refreshToken)

        val memberId = refreshTokenRepository.consume(refreshToken)
            ?: throw InvalidRefreshTokenException()
        val member = memberAuthLookupService.findById(memberId)
            ?.takeIf { it.enabled }
            ?: throw InvalidRefreshTokenException()

        return RefreshTokenPayload(
            member = member.toView(),
            tokens = issueTokenPair(member),
        )
    }

    @Transactional
    fun logout(input: LogoutInput): LogoutPayload {
        val refreshToken = input.refreshToken.trim()
        requireNonBlankText("refreshToken", refreshToken)

        refreshTokenRepository.delete(refreshToken)
        return LogoutPayload(loggedOut = true)
    }

    private fun issueTokenPair(member: MemberAuthLookup): AuthTokenPair {
        val issuedAt = Instant.now()
        val refreshTokenExpiresAt = issuedAt.plus(authProperties.refreshTokenTtl)
        val accessToken = accessTokenService.issue(member, issuedAt)

        return AuthTokenPair(
            accessToken = accessToken.tokenValue,
            refreshToken = refreshTokenRepository.create(member.id),
            accessTokenExpiresAt = accessToken.expiresAt.toLocalDateTime(),
            refreshTokenExpiresAt = refreshTokenExpiresAt.toLocalDateTime(),
        )
    }

    private fun Instant.toLocalDateTime(): LocalDateTime =
        LocalDateTime.ofInstant(this, ZoneOffset.UTC)

    private fun MemberAuthLookup.toView(): MemberView =
        MemberView(
            id = id,
            name = name,
            email = email,
            admin = admin,
            enabled = enabled,
            createdAt = createdAt,
        )
}
