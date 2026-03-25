package ai.ssot.contextapi.security.filter

import ai.ssot.contextapi.security.token.TokenService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.AuthenticationException
import org.springframework.security.core.authority.SimpleGrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class AuthenticationFilter(
    private val tokenService: TokenService,
): OncePerRequestFilter() {
    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
        val accessToken = request.getHeader(TokenService.ACCESS_TOKEN_HEADER)
        SecurityContextHolder.clearContext()

        if (accessToken != null) {
            try {
                tokenService.verify(accessToken)
                accessToken.replace(TokenService.TOKEN_PREFIX, "")
                    .apply {
                        SecurityContextHolder.getContext().authentication = getAuthentication(this)
                    }
            } catch (exception: AuthenticationException) {
                SecurityContextHolder.clearContext()
                throw exception
            }
        }

        filterChain.doFilter(request, response)
    }

    private fun getAuthentication(token: String): UsernamePasswordAuthenticationToken {

        val id = tokenService.getId(token)
        val role = if (tokenService.isAdmin(token)) {
            "ROLE_ADMIN"
        } else {
            "ROLE_USER"
        }

        return UsernamePasswordAuthenticationToken(id, "", listOf(SimpleGrantedAuthority(role)))
    }
}
