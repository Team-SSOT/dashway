package ai.ssot.chat.config.auth

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.AuthenticationException
import org.springframework.security.core.GrantedAuthority
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class ChatGraphQlAuthenticationFilter(
    private val authClient: ContextApiAuthClient,
    private val authenticationEntryPoint: AuthenticationEntryPoint,
) : OncePerRequestFilter() {
    override fun shouldNotFilter(request: HttpServletRequest): Boolean =
        request.servletPath != "/graphql" || request.method != HttpMethod.POST.name()

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        SecurityContextHolder.clearContext()

        val authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION)
            ?.takeIf { it.isNotBlank() }
            ?: return authenticationEntryPoint.commence(
                request,
                response,
                AuthenticationCredentialsNotFoundException("Authentication is required."),
            )

        val memberId = try {
            authClient.validate(authorizationHeader)
        } catch (exception: AuthenticationException) {
            SecurityContextHolder.clearContext()
            return authenticationEntryPoint.commence(request, response, exception)
        }

        SecurityContextHolder.getContext().authentication =
            UsernamePasswordAuthenticationToken.authenticated(memberId, "", emptyList<GrantedAuthority>())
        filterChain.doFilter(request, response)
    }
}
