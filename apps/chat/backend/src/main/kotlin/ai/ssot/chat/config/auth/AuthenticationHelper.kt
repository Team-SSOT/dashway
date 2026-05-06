package ai.ssot.chat.config.auth

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException
import org.springframework.security.core.context.SecurityContextHolder

fun <T> withMemberId(block: (Long) -> T): T {
    val memberId = getMemberId()
    return block(memberId)
}

private fun getMemberId(): Long = (SecurityContextHolder.getContext()
    .authentication
    ?.takeIf { it.isAuthenticated }
    ?.principal as? Long
    ?: throw AuthenticationCredentialsNotFoundException("Authentication is required."))
