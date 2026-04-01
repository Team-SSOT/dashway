package ai.ssot.contextapi.domain.auth.service

import ai.ssot.contextapi.domain.auth.dto.AuthDto
import ai.ssot.contextapi.domain.auth.dto.AuthTokenDto
import ai.ssot.contextapi.domain.auth.exception.InvalidRefreshTokenException
import ai.ssot.contextapi.domain.auth.exception.LoginFailureException
import ai.ssot.contextapi.domain.auth.repository.TokenRepository
import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.domain.member.service.MemberService
import ai.ssot.contextapi.security.token.TokenService
import ai.ssot.contextapi.security.token.TokenService.Companion.TOKEN_PREFIX
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AuthService(
    private val memberService: MemberService,
    private val passwordEncoder: PasswordEncoder,
    private val tokenRepository: TokenRepository,
    private val tokenService: TokenService,
    private val authorityService: AuthorityService,
) {

    @Transactional(readOnly = true)
    fun login(email: String, password: String): AuthDto {
        val normalizedEmail = email.trim()

        val member = memberService.findByEmail(normalizedEmail)
            ?.takeIf { it.isEnabled }
            ?.takeIf { passwordEncoder.matches(password, it.password) }
            ?: throw LoginFailureException()

        val authorities = authorityService.getAllDtoByMemberId(member.id!!)
        val (accessToken, refreshToken) = tokenService.generateTokens(member.id!!, authorities.map { it.name })
        tokenRepository.saveRefreshToken(
            memberId = member.id!!,
            refreshToken = refreshToken,
            ttlSeconds = tokenService.getTtl(refreshToken),
        )

        return AuthDto(
            member = MemberDto(member),
            tokens = AuthTokenDto(accessToken, refreshToken),
        )
    }

    @Transactional
    fun refreshTokens(refreshToken: String): AuthDto {

        val memberId = tokenService.getMemberId(refreshToken)
        if(!tokenRepository.deleteRefreshToken(refreshToken)) {
            throw InvalidRefreshTokenException()
        }

        val member = memberService.getById(memberId)
        val authorities = authorityService.getAllDtoByMemberId(memberId)

        val (newAccessToken, newRefreshToken) = tokenService.generateTokens(memberId, authorities.map { it.name })
        tokenRepository.saveRefreshToken(
            memberId = memberId,
            refreshToken = newRefreshToken,
            ttlSeconds = tokenService.getTtl(newRefreshToken),
        )

        return AuthDto(
            member = MemberDto(member),
            tokens = AuthTokenDto(
                accessToken = newAccessToken,
                refreshToken = newRefreshToken,
            ),
        )
    }

    @Transactional
    fun logout(accessToken: String, refreshToken: String): Boolean {
        val rawAccessToken = accessToken.removePrefix(TOKEN_PREFIX)
        tokenRepository.deleteRefreshToken(refreshToken)
        tokenRepository.saveBlacklistToken(rawAccessToken, tokenService.getTtl(rawAccessToken))
        return true
    }
}
