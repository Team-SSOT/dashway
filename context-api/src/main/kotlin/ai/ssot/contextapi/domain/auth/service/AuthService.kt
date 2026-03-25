package ai.ssot.contextapi.domain.auth.service

import ai.ssot.contextapi.domain.auth.dto.*
import ai.ssot.contextapi.domain.auth.exception.InvalidCredentialsException
import ai.ssot.contextapi.domain.auth.exception.InvalidRefreshTokenException
import ai.ssot.contextapi.domain.auth.repository.RefreshTokenRepository
import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.domain.member.service.MemberAuthLookup
import ai.ssot.contextapi.domain.member.service.MemberAuthLookupService
import ai.ssot.contextapi.security.AuthProperties
import ai.ssot.contextapi.security.token.TokenService
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
    private val tokenService: TokenService,
) {
    @Transactional(readOnly = true)
    fun me(): MemberDto? =
        memberAuthLookupService.findById(currentViewerService.requireAuthenticated().memberId)?.let { member ->
            MemberDto(
                id = member.id,
                name = member.name,
                email = member.email,
                admin = member.admin,
                enabled = member.enabled,
                createdDatetime = member.createdDatetime,
            )
        }

    @Transactional(readOnly = true)
    fun login(input: LoginInput): AuthSessionDto {
        val email = input.email.trim()
        requireNonBlankText("email", email)
        requireNonBlankText("password", input.password)

        val member = memberAuthLookupService.findByEmail(email)
            ?.takeIf { it.enabled }
            ?.takeIf { !it.passwordHash.isNullOrBlank() }
            ?.takeIf { passwordEncoder.matches(input.password, it.passwordHash) }
            ?: throw InvalidCredentialsException()

        return AuthSessionDto(
            member = MemberDto(
                id = member.id,
                name = member.name,
                email = member.email,
                admin = member.admin,
                enabled = member.enabled,
                createdDatetime = member.createdDatetime,
            ),
            tokens = issueTokenPair(member),
        )
    }

    @Transactional
    fun refreshToken(input: RefreshTokenInput): AuthSessionDto {
        val refreshToken = input.refreshToken.trim()
        requireNonBlankText("refreshToken", refreshToken)

        val memberId = refreshTokenRepository.consume(refreshToken)
            ?: throw InvalidRefreshTokenException()
        val member = memberAuthLookupService.findById(memberId)
            ?.takeIf { it.enabled }
            ?: throw InvalidRefreshTokenException()

        return AuthSessionDto(
            member = MemberDto(
                id = member.id,
                name = member.name,
                email = member.email,
                admin = member.admin,
                enabled = member.enabled,
                createdDatetime = member.createdDatetime,
            ),
            tokens = issueTokenPair(member),
        )
    }

    @Transactional
    fun logout(input: LogoutInput): Boolean {
        val refreshToken = input.refreshToken.trim()
        requireNonBlankText("refreshToken", refreshToken)

        refreshTokenRepository.delete(refreshToken)
        return true
    }

    private fun issueTokenPair(member: MemberAuthLookup): AuthTokenPair {
        val issuedAt = Instant.now()
        val accessTokenExpiresAt = issuedAt.plus(authProperties.accessTokenTtl)
        val refreshTokenExpiresAt = issuedAt.plus(authProperties.refreshTokenTtl)
        val accessToken = tokenService.generateAccessToken(member.id, member.admin)

        return AuthTokenPair(
            accessToken = accessToken,
            refreshToken = refreshTokenRepository.create(member.id),
            accessTokenExpiresAt = accessTokenExpiresAt.toLocalDateTime(),
            refreshTokenExpiresAt = refreshTokenExpiresAt.toLocalDateTime(),
        )
    }

    private fun Instant.toLocalDateTime(): LocalDateTime =
        LocalDateTime.ofInstant(this, ZoneOffset.UTC)
}
