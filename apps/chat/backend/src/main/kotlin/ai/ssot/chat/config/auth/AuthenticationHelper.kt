package ai.ssot.chat.config.auth

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException
import org.springframework.security.core.context.SecurityContextHolder
import java.security.Principal

class ChatMemberPrincipal(
    val memberId: Long,
) : Principal {
    override fun getName(): String = memberId.toString()
}

fun <T> withMemberId(block: (Long) -> T): T {
    val memberId = getMemberId()
    return block(memberId)
}

fun Principal.memberId(): Long = (this as? ChatMemberPrincipal)?.memberId
    ?: throw AuthenticationCredentialsNotFoundException("Authentication is required.")

private fun getMemberId(): Long = (SecurityContextHolder.getContext()
    .authentication
    ?.takeIf { it.isAuthenticated }
    ?.principal as? Long
    ?: throw AuthenticationCredentialsNotFoundException("Authentication is required."))
