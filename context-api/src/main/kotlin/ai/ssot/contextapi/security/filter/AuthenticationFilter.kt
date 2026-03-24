package ai.ssot.contextapi.security.filter

import ai.ssot.contextapi.security.exception.UnauthenticatedException
import ai.ssot.contextapi.security.token.TokenService
import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.Authentication
import org.springframework.security.core.AuthenticationException
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class AuthenticationFilter(
    private val tokenService: TokenService,
    private val objectMapper: ObjectMapper
): OncePerRequestFilter() {


    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {

        val accessToken = request.getHeader(TokenService.ACCESS_TOKEN_HEADER)
        val refreshToken = request.getHeader(TokenService.REFRESH_TOKEN_HEADER)
        val context = SecurityContextHolder.getContext()

        if(accessToken != null) {
            verifyToken(accessToken, response)

            accessToken.replace(TokenService.TOKEN_PREFIX, "")
                .apply {
                    SecurityContextHolder.getContext().authentication = getAuthentication(this)
                }
        }

        filterChain.doFilter(request, response)
    }

    private fun getAuthentication(token: String): UsernamePasswordAuthenticationToken {

        val id = tokenService.getId(token)
        val role = "ROLE_${tokenService.getUserRole (token)}"

        return UsernamePasswordAuthenticationToken(id, "", listOf(SimpleGrantedAuthority(role)))
    }

    private fun verifyToken(token: String, response: HttpServletResponse) {
        runCatching {
            tokenService.verify(token)
        }.onFailure { exception ->

            val errorResponse = when (exception) {
                is AuthenticationException -> ExceptionResponse(exception.errorCode)
                else -> ExceptionResponse(ErrorCode.SERVER_ERROR.code, message = "Unknown error with verify Token: ${exception.message}")
            }

            response.status = HttpServletResponse.SC_UNAUTHORIZED
            response.contentType = MediaType.APPLICATION_JSON_VALUE
            response.writer.write(objectMapper.writeValueAsString(errorResponse))
            response.writer.flush()
        }
    }
}