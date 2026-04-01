package ai.ssot.contextapi.domain.auth.controller

import ai.ssot.contextapi.domain.auth.exception.InvalidRefreshTokenException
import ai.ssot.contextapi.domain.auth.exception.UnauthenticatedException
import ai.ssot.contextapi.domain.auth.service.AuthService
import ai.ssot.contextapi.domain.auth.service.withAuthenticatedMember
import ai.ssot.contextapi.generated.types.LoginInput
import ai.ssot.contextapi.generated.types.LoginPayload
import ai.ssot.contextapi.security.AuthProperties
import ai.ssot.contextapi.security.token.TokenService.Companion.ACCESS_TOKEN_HEADER
import ai.ssot.contextapi.security.token.TokenService.Companion.REFRESH_TOKEN_HEADER
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.InputArgument
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie

@DgsComponent
class AuthController(
    private val authService: AuthService,
    private val authProperties: AuthProperties,
) {

    @DgsMutation
    fun login(@InputArgument input: LoginInput, response: HttpServletResponse): LoginPayload {
        val auth = authService.login(input.email, input.password)
        addRefreshTokenCookie(auth.tokens.refreshToken, response)
        return auth.toGraphQL()
    }

    @DgsMutation
    fun logout(request: HttpServletRequest): Boolean {
        return withAuthenticatedMember {
            val accessToken = request.getHeader(ACCESS_TOKEN_HEADER) ?: run { throw UnauthenticatedException() }
            val refreshToken = getRefreshToken(request)

            authService.logout(accessToken, refreshToken)
        }
    }

    @DgsMutation
    fun refresh(request: HttpServletRequest, response: HttpServletResponse): LoginPayload {
        val refreshToken = getRefreshToken(request)

        val auth = authService.refreshTokens(refreshToken)
        addRefreshTokenCookie(auth.tokens.refreshToken, response)

        return auth.toGraphQL()
    }

    private fun getRefreshToken(request: HttpServletRequest): String {
        return request.cookies
            ?.firstOrNull { it.name == REFRESH_TOKEN_HEADER }
            ?.value
            ?.takeIf { it.isNotBlank() }
            ?: run {
                throw InvalidRefreshTokenException()
            }
    }

    private fun addRefreshTokenCookie(
        refreshToken: String,
        response: HttpServletResponse
    ) {
        response.addHeader(
            HttpHeaders.SET_COOKIE,
            ResponseCookie.from(REFRESH_TOKEN_HEADER, refreshToken)
                .httpOnly(true)
                .secure(authProperties.refreshCookie.secure)
                .sameSite(authProperties.refreshCookie.sameSite)
                .path(authProperties.refreshCookie.path)
                .maxAge(authProperties.refreshTokenTtl)
                .build()
                .toString(),
        )
    }
}

