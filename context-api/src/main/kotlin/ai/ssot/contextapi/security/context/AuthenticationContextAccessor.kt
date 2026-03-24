package ai.ssot.contextapi.security.context

import ai.ssot.contextapi.security.principal.AuthenticatedMemberPrincipal
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Component

@Component
class AuthenticationContextAccessor {
    fun authenticatedMemberPrincipalOrNull(): AuthenticatedMemberPrincipal? =
        SecurityContextHolder.getContext().authentication?.principal as? AuthenticatedMemberPrincipal
}
